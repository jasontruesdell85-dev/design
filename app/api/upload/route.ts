import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { env } from "@/lib/env";
import { validSessionId } from "@/lib/validation";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/heic", "image/heif"]);
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const sessionId = validSessionId(formData.get("sessionId"));

  if (!(file instanceof File) || !sessionId) {
    return NextResponse.json({ error: "A valid file and session are required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, and HEIC files are supported" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is too large. Maximum size is 12MB" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `uploads/${sessionId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(env.storageBucketName)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const publicUrlData = supabaseAdmin.storage.from(env.storageBucketName).getPublicUrl(path).data;

  await supabaseAdmin.from("uploaded_files").insert({
    session_id: sessionId,
    file_url: publicUrlData.publicUrl,
    file_name: file.name,
    file_type: file.type
  });

  return NextResponse.json({ fileUrl: publicUrlData.publicUrl, path });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { sessionId?: string; filePath?: string; fileUrl?: string };
  const sessionId = validSessionId(body.sessionId);
  if (!sessionId) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const rawPath = (body.filePath || "").trim();
  const path = rawPath.startsWith(`uploads/${sessionId}/`) ? rawPath : null;

  if (path) {
    await supabaseAdmin.storage.from(env.storageBucketName).remove([path]);
  }

  if (body.fileUrl) {
    await supabaseAdmin.from("uploaded_files").delete().eq("session_id", sessionId).eq("file_url", body.fileUrl);
  } else {
    await supabaseAdmin.from("uploaded_files").delete().eq("session_id", sessionId);
  }

  return NextResponse.json({ ok: true });
}
