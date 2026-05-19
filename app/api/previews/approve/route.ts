import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cleanText, validSessionId } from "@/lib/validation";

export async function POST(request: Request) {
  const body = (await request.json()) as { sessionId?: string; previewId?: string };
  const sessionId = validSessionId(body.sessionId);
  const previewId = cleanText(body.previewId, 80);

  if (!sessionId || !previewId) {
    return NextResponse.json({ error: "sessionId and previewId are required" }, { status: 400 });
  }

  const { data: preview, error: previewError } = await supabaseAdmin
    .from("generated_previews")
    .select("id, session_id, artwork_url, mockup_url")
    .eq("id", previewId)
    .eq("session_id", sessionId)
    .single();

  if (previewError || !preview) {
    return NextResponse.json({ error: "Preview not found" }, { status: 404 });
  }

  await Promise.all([
    supabaseAdmin.from("generated_previews").update({ is_approved: false }).eq("session_id", sessionId),
    supabaseAdmin.from("generated_previews").update({ is_approved: true }).eq("id", previewId)
  ]);

  return NextResponse.json({
    approved: true,
    previewId: preview.id,
    artworkUrl: preview.artwork_url,
    mockupUrl: preview.mockup_url
  });
}
