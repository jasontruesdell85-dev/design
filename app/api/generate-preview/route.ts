import OpenAI from "openai";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildMemorialPrompt } from "@/lib/prompt-builder";
import { composeArtwork, composeMockup } from "@/lib/image-compose";

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
};

export async function POST(request: Request) {
  if (!env.openAiApiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body = (await request.json()) as GenerateRequest;

  if (!body.sessionId || !body.productId) {
    return NextResponse.json({ error: "sessionId and productId are required" }, { status: 400 });
  }

  const prompt = buildMemorialPrompt({
    productName: body.productName,
    material: body.material,
    orientation: body.orientation,
    deceasedName: body.deceasedName,
    memorialDates: body.memorialDates,
    quoteOrMessage: body.quoteOrMessage,
    themeStyle: body.themeStyle,
    colors: body.colors,
    religiousOrSpiritualElements: body.religiousOrSpiritualElements,
    hobbiesInterestsPlaces: body.hobbiesInterestsPlaces,
    generalInstructions: body.generalInstructions
  });

  const openai = new OpenAI({ apiKey: env.openAiApiKey });
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: body.orientation === "landscape" ? "1536x1024" : "1024x1536"
  });

  const b64 = response.data[0]?.b64_json;
  if (!b64) {
    return NextResponse.json({ error: "No image data returned" }, { status: 500 });
  }

  const generatedBuffer = Buffer.from(b64, "base64");
  const artworkBuffer = await composeArtwork(generatedBuffer, {
    productId: body.productId,
    orientation: body.orientation,
    deceasedName: body.deceasedName,
    memorialDates: body.memorialDates,
    quoteOrMessage: body.quoteOrMessage
  });

  const mockupBuffer = await composeMockup(artworkBuffer, body.productId);

  const ts = Date.now();
  const artworkPath = `generated/${body.sessionId}/artwork-${ts}.png`;
  const mockupPath = `generated/${body.sessionId}/mockup-${ts}.png`;

  const [artworkUpload, mockupUpload] = await Promise.all([
    supabaseAdmin.storage.from(env.storageBucketName).upload(artworkPath, artworkBuffer, { contentType: "image/png", upsert: true }),
    supabaseAdmin.storage.from(env.storageBucketName).upload(mockupPath, mockupBuffer, { contentType: "image/png", upsert: true })
  ]);

  if (artworkUpload.error || mockupUpload.error) {
    return NextResponse.json({ error: artworkUpload.error?.message ?? mockupUpload.error?.message }, { status: 500 });
  }

  const artworkUrl = supabaseAdmin.storage.from(env.storageBucketName).getPublicUrl(artworkPath).data.publicUrl;
  const mockupUrl = supabaseAdmin.storage.from(env.storageBucketName).getPublicUrl(mockupPath).data.publicUrl;

  const { data: preview, error: previewError } = await supabaseAdmin
    .from("generated_previews")
    .insert({
      session_id: body.sessionId,
      product_id: body.productId,
      prompt_used: prompt,
      artwork_url: artworkUrl,
      mockup_url: mockupUrl,
      is_approved: false
    })
    .select("id")
    .single();

  if (previewError) {
    return NextResponse.json({ error: previewError.message }, { status: 500 });
  }

  return NextResponse.json({ previewId: preview.id, prompt, artworkUrl, mockupUrl });
}
