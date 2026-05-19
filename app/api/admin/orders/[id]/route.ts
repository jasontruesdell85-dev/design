import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 404 });
  }

  const { data: uploads } = await supabaseAdmin
    .from("uploaded_files")
    .select("*")
    .eq("order_id", params.id)
    .order("created_at", { ascending: false });

  const { data: previews } = await supabaseAdmin
    .from("generated_previews")
    .select("*")
    .eq("order_id", params.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ order, uploads: uploads ?? [], previews: previews ?? [] });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { status?: string; internal_notes?: string };

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status: body.status, internal_notes: body.internal_notes })
    .eq("id", params.id)
    .select("id, status, internal_notes")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}
