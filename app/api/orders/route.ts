import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { OrderInsert } from "@/lib/models";

const requiredFields = [
  "product_id",
  "product_name",
  "deceased_name",
  "customer_name",
  "customer_email",
  "customer_phone",
  "shipping_address_line_1",
  "shipping_city",
  "shipping_region",
  "shipping_postal_code",
  "shipping_country"
] as const;

export async function POST(request: Request) {
  const body = (await request.json()) as OrderInsert & { session_id?: string; approved_preview_id?: string };

  for (const field of requiredFields) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  if (!body.session_id || !body.approved_preview_id) {
    return NextResponse.json({ error: "Approved preview is required before submission" }, { status: 400 });
  }

  const { data: approvedPreview } = await supabaseAdmin
    .from("generated_previews")
    .select("id, session_id, artwork_url, mockup_url, is_approved")
    .eq("id", body.approved_preview_id)
    .eq("session_id", body.session_id)
    .single();

  if (!approvedPreview?.is_approved) {
    return NextResponse.json({ error: "Approved preview is required before submission" }, { status: 400 });
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      ...body,
      status: "Submitted",
      approved_artwork_url: approvedPreview.artwork_url,
      approved_mockup_url: approvedPreview.mockup_url
    })
    .select("id")
    .single();

  if (error || !order) {
    return NextResponse.json({ error: error?.message ?? "Failed to create order" }, { status: 500 });
  }

  await Promise.all([
    supabaseAdmin.from("uploaded_files").update({ order_id: order.id }).eq("session_id", body.session_id).is("order_id", null),
    supabaseAdmin.from("generated_previews").update({ order_id: order.id }).eq("session_id", body.session_id).is("order_id", null)
  ]);

  return NextResponse.json({ orderId: order.id, status: "Submitted" });
}
