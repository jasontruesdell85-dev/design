import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const sessionId = String(formData.get("sessionId") || "");

  if (!(file instanceof File) || !sessionId) {
    return NextResponse.json({ error: "file and sessionId are required" }, { status: 400 });
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

  const { data: publicUrlData } = supabaseAdmin.storage.from(env.storageBucketName).getPublicUrl(path);

  await supabaseAdmin.from("uploaded_files").insert({
    session_id: sessionId,
    file_url: publicUrlData.publicUrl,
    file_name: file.name,
    file_type: file.type
  });

  return NextResponse.json({ fileUrl: publicUrlData.publicUrl, path });
}
