import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = (await request.json()) as { sessionId?: string; previewId?: string };

  if (!body.sessionId || !body.previewId) {
    return NextResponse.json({ error: "sessionId and previewId are required" }, { status: 400 });
  }

  const { data: preview, error: previewError } = await supabaseAdmin
    .from("generated_previews")
    .select("id, session_id, artwork_url, mockup_url")
    .eq("id", body.previewId)
    .eq("session_id", body.sessionId)
    .single();

  if (previewError || !preview) {
    return NextResponse.json({ error: "Preview not found" }, { status: 404 });
  }

  await Promise.all([
    supabaseAdmin.from("generated_previews").update({ is_approved: false }).eq("session_id", body.sessionId),
    supabaseAdmin.from("generated_previews").update({ is_approved: true }).eq("id", body.previewId)
  ]);

  return NextResponse.json({
    approved: true,
    previewId: preview.id,
    artworkUrl: preview.artwork_url,
    mockupUrl: preview.mockup_url
  });
}
