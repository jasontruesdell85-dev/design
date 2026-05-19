import OpenAI from "openai";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  if (!env.openAiApiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body = (await request.json()) as {
    sessionId?: string;
    productId?: string;
    prompt?: string;
  };

  if (!body.sessionId || !body.productId || !body.prompt) {
    return NextResponse.json({ error: "sessionId, productId, and prompt are required" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: env.openAiApiKey });
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt: body.prompt,
    size: "1024x1024"
  });

  const b64 = response.data[0]?.b64_json;
  if (!b64) {
    return NextResponse.json({ error: "No image data returned" }, { status: 500 });
  }

  const buffer = Buffer.from(b64, "base64");
  const ts = Date.now();
  const artworkPath = `generated/${body.sessionId}/artwork-${ts}.png`;
  const mockupPath = `generated/${body.sessionId}/mockup-${ts}.png`;

  const [artworkUpload, mockupUpload] = await Promise.all([
    supabaseAdmin.storage.from(env.storageBucketName).upload(artworkPath, buffer, { contentType: "image/png", upsert: true }),
    supabaseAdmin.storage.from(env.storageBucketName).upload(mockupPath, buffer, { contentType: "image/png", upsert: true })
  ]);

  if (artworkUpload.error || mockupUpload.error) {
    return NextResponse.json({ error: artworkUpload.error?.message ?? mockupUpload.error?.message }, { status: 500 });
  }

  const artworkUrl = supabaseAdmin.storage.from(env.storageBucketName).getPublicUrl(artworkPath).data.publicUrl;
  const mockupUrl = supabaseAdmin.storage.from(env.storageBucketName).getPublicUrl(mockupPath).data.publicUrl;

  await supabaseAdmin.from("generated_previews").insert({
    session_id: body.sessionId,
    product_id: body.productId,
    prompt_used: body.prompt,
    artwork_url: artworkUrl,
    mockup_url: mockupUrl,
    is_approved: false
  });

  return NextResponse.json({ artworkUrl, mockupUrl });
}
