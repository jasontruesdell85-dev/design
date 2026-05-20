import OpenAI from "openai";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildMemorialPrompt } from "@/lib/prompt-builder";
import { composeArtwork } from "@/lib/image-compose";
import { cleanText, validOrientation, validProductId, validSessionId } from "@/lib/validation";

type GenerateRequest = {
  sessionId?: string;
  productId?: string;
  productName?: string;
  material?: string;
  orientation?: string;
  deceasedName?: string;
  memorialDates?: string;
  quoteOrMessage?: string;
  themeStyle?: string;
  colors?: string;
  religiousOrSpiritualElements?: string;
  hobbiesInterestsPlaces?: string;
  generalInstructions?: string;
  typography?: {
    nameFont?: string;
    bodyFont?: string;
  };
};

function extractStoragePathFromFileUrl(fileUrl: string, bucketName: string) {
  const marker = `/${bucketName}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx < 0) return null;
  const raw = fileUrl.slice(idx + marker.length);
  return raw.split("?")[0] || null;
}

export async function POST(request: Request) {
  try {
    if (!env.openAiApiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const body = (await request.json()) as GenerateRequest;
    const sessionId = validSessionId(body.sessionId);
    const productId = cleanText(body.productId, 40);
    const orientation = validOrientation(body.orientation);

    if (!sessionId || !validProductId(productId)) {
      return NextResponse.json({ error: "Valid sessionId and productId are required" }, { status: 400 });
    }

    const { data: latestUploads } = await supabaseAdmin
      .from("uploaded_files")
      .select("file_url, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1);

    let referenceImageUrl: string | null = latestUploads?.[0]?.file_url ?? null;
    if (referenceImageUrl) {
      const storagePath = extractStoragePathFromFileUrl(referenceImageUrl, env.storageBucketName);
      if (storagePath) {
        const signed = await supabaseAdmin.storage.from(env.storageBucketName).createSignedUrl(storagePath, 60 * 15);
        if (signed.data?.signedUrl) referenceImageUrl = signed.data.signedUrl;
      }
    }

    const prompt = buildMemorialPrompt({
      productName: cleanText(body.productName, 80),
      material: cleanText(body.material, 80),
      orientation,
      deceasedName: cleanText(body.deceasedName, 120),
      memorialDates: cleanText(body.memorialDates, 80),
      quoteOrMessage: cleanText(body.quoteOrMessage, 300),
      themeStyle: cleanText(body.themeStyle, 300),
      colors: cleanText(body.colors, 180),
      religiousOrSpiritualElements: cleanText(body.religiousOrSpiritualElements, 240),
      hobbiesInterestsPlaces: cleanText(body.hobbiesInterestsPlaces, 600),
      generalInstructions: cleanText(body.generalInstructions, 900)
    });
    const promptWithPhotoUse = referenceImageUrl
      ? `${prompt}\nUse the provided reference photo as the subject. Preserve the same person's facial features and overall likeness. Do not invent or substitute a different person.`
      : prompt;

    const openai = new OpenAI({ apiKey: env.openAiApiKey });
    const size = orientation === "landscape" ? "1536x1024" : "1024x1536";

    let response;
    if (referenceImageUrl) {
      const refRes = await fetch(referenceImageUrl);
      if (!refRes.ok) {
        return NextResponse.json({ error: "Could not read uploaded reference photo" }, { status: 500 });
      }
      const refBytes = await refRes.arrayBuffer();
      const refFile = new File([refBytes], "reference.png", { type: "image/png" });
      response = await openai.images.edit({
        model: "gpt-image-1",
        prompt: promptWithPhotoUse,
        image: refFile,
        size
      });
    } else {
      response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: promptWithPhotoUse,
        size
      });
    }

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "No image data returned" }, { status: 500 });
    }

    const generatedBuffer = Buffer.from(b64, "base64");
    const artworkBuffer = await composeArtwork(generatedBuffer, {
      productId,
      orientation,
      deceasedName: cleanText(body.deceasedName, 120),
      memorialDates: cleanText(body.memorialDates, 80),
      quoteOrMessage: cleanText(body.quoteOrMessage, 300),
      typography: {
        nameFont: cleanText(body.typography?.nameFont, 120),
        bodyFont: cleanText(body.typography?.bodyFont, 120)
      }
    });

    const ts = Date.now();
    const artworkPath = `generated/${sessionId}/artwork-${ts}.png`;
    const { error: artworkUploadError } = await supabaseAdmin.storage
      .from(env.storageBucketName)
      .upload(artworkPath, artworkBuffer, { contentType: "image/png", upsert: true });

    if (artworkUploadError) {
      return NextResponse.json({ error: artworkUploadError.message }, { status: 500 });
    }

    const artworkSigned = await supabaseAdmin.storage
      .from(env.storageBucketName)
      .createSignedUrl(artworkPath, 60 * 60 * 24);

    const artworkUrl =
      artworkSigned.data?.signedUrl ??
      supabaseAdmin.storage.from(env.storageBucketName).getPublicUrl(artworkPath).data.publicUrl;
    const mockupUrl = artworkUrl;

    const { data: preview, error: previewError } = await supabaseAdmin
      .from("generated_previews")
      .insert({
        session_id: sessionId,
        product_id: productId,
        prompt_used: promptWithPhotoUse,
        artwork_url: artworkUrl,
        mockup_url: mockupUrl,
        is_approved: false
      })
      .select("id")
      .single();

    if (previewError || !preview) {
      return NextResponse.json({ error: previewError?.message ?? "Failed to save preview" }, { status: 500 });
    }

    return NextResponse.json({ previewId: preview.id, prompt: promptWithPhotoUse, artworkUrl, mockupUrl });
  } catch (error: unknown) {
    const fallback = "Preview generation failed";
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || fallback }, { status: 500 });
    }
    const maybeObj = error as { message?: string; error?: { message?: string } };
    const message = maybeObj?.error?.message || maybeObj?.message || fallback;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
