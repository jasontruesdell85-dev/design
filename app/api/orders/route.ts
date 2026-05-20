import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { OrderInsert } from "@/lib/models";
import { cleanText, validEmail, validOrientation, validProductId, validSessionId } from "@/lib/validation";

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
    if (!cleanText(body[field], 200)) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const sessionId = validSessionId(body.session_id);
  const approvedPreviewId = cleanText(body.approved_preview_id, 80);
  const productId = cleanText(body.product_id, 40);

  if (!sessionId || !validProductId(productId)) {
    return NextResponse.json({ error: "Approved preview is required before submission" }, { status: 400 });
  }

  if (!validEmail(body.customer_email)) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  let approvedPreview = null as null | {
    id: string;
    session_id: string;
    artwork_url: string | null;
    mockup_url: string | null;
    is_approved: boolean | null;
  };

  if (approvedPreviewId) {
    const { data } = await supabaseAdmin
      .from("generated_previews")
      .select("id, session_id, artwork_url, mockup_url, is_approved")
      .eq("id", approvedPreviewId)
      .eq("session_id", sessionId)
      .single();
    approvedPreview = data;
  }

  if (!approvedPreview?.is_approved) {
    const { data } = await supabaseAdmin
      .from("generated_previews")
      .select("id, session_id, artwork_url, mockup_url, is_approved")
      .eq("session_id", sessionId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    approvedPreview = data;
  }

  if (!approvedPreview?.is_approved) {
    return NextResponse.json({ error: "Approved preview is required before submission" }, { status: 400 });
  }

  const payload: OrderInsert = {
    product_id: productId,
    product_name: cleanText(body.product_name, 120),
    orientation: validOrientation(body.orientation),
    deceased_name: cleanText(body.deceased_name, 120),
    memorial_dates: cleanText(body.memorial_dates, 80),
    theme_style: cleanText(body.theme_style, 300),
    colors: cleanText(body.colors, 180),
    religious_or_spiritual_elements: cleanText(body.religious_or_spiritual_elements, 300),
    hobbies_interests_places: cleanText(body.hobbies_interests_places, 800),
    quote_or_message: cleanText(body.quote_or_message, 500),
    general_instructions: cleanText(body.general_instructions, 1000),
    customer_name: cleanText(body.customer_name, 120),
    customer_email: cleanText(body.customer_email, 254),
    customer_phone: cleanText(body.customer_phone, 60),
    shipping_address_line_1: cleanText(body.shipping_address_line_1, 180),
    shipping_address_line_2: cleanText(body.shipping_address_line_2, 180),
    shipping_city: cleanText(body.shipping_city, 100),
    shipping_region: cleanText(body.shipping_region, 100),
    shipping_postal_code: cleanText(body.shipping_postal_code, 30),
    shipping_country: cleanText(body.shipping_country, 80),
    customer_notes: cleanText(body.customer_notes, 500),
    approved_artwork_url: approvedPreview.artwork_url,
    approved_mockup_url: approvedPreview.mockup_url
  };

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({ ...payload, status: "Submitted" })
    .select("id")
    .single();

  if (error || !order) {
    return NextResponse.json({ error: error?.message ?? "Failed to create order" }, { status: 500 });
  }

  await Promise.all([
    supabaseAdmin.from("uploaded_files").update({ order_id: order.id }).eq("session_id", sessionId).is("order_id", null),
    supabaseAdmin.from("generated_previews").update({ order_id: order.id }).eq("session_id", sessionId).is("order_id", null)
  ]);

  return NextResponse.json({ orderId: order.id, status: "Submitted" });
}
