import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { env } from "@/lib/env";

async function getOrder(id: string) {
  const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", id).single();
  const { data: uploads } = await supabaseAdmin.from("uploaded_files").select("*").eq("order_id", id);
  const { data: previews } = await supabaseAdmin
    .from("generated_previews")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: false });
  return { order, uploads: uploads ?? [], previews: previews ?? [] };
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  const { order, uploads, previews } = await getOrder(params.id);
  if (!order) notFound();

  async function updateOrder(formData: FormData) {
    "use server";

    const status = String(formData.get("status") ?? "Submitted");
    const internalNotes = String(formData.get("internal_notes") ?? "");

    await supabaseAdmin
      .from("orders")
      .update({ status, internal_notes: internalNotes })
      .eq("id", params.id);
  }

  async function approvePreview(formData: FormData) {
    "use server";

    const previewId = String(formData.get("preview_id") ?? "");
    if (!previewId) return;

    const { data: preview } = await supabaseAdmin
      .from("generated_previews")
      .select("*")
      .eq("id", previewId)
      .single();

    if (!preview?.artwork_url || !preview?.mockup_url) return;

    const [artworkRes, mockupRes] = await Promise.all([fetch(preview.artwork_url), fetch(preview.mockup_url)]);
    if (!artworkRes.ok || !mockupRes.ok) return;

    const [artworkBuffer, mockupBuffer] = await Promise.all([artworkRes.arrayBuffer(), mockupRes.arrayBuffer()]);

    const approvedArtworkPath = `orders/${params.id}/approved-artwork.png`;
    const approvedMockupPath = `orders/${params.id}/mockup.png`;

    await Promise.all([
      supabaseAdmin.storage
        .from(env.storageBucketName)
        .upload(approvedArtworkPath, Buffer.from(artworkBuffer), { contentType: "image/png", upsert: true }),
      supabaseAdmin.storage
        .from(env.storageBucketName)
        .upload(approvedMockupPath, Buffer.from(mockupBuffer), { contentType: "image/png", upsert: true })
    ]);

    const approvedArtworkUrl = supabaseAdmin.storage.from(env.storageBucketName).getPublicUrl(approvedArtworkPath).data.publicUrl;
    const approvedMockupUrl = supabaseAdmin.storage.from(env.storageBucketName).getPublicUrl(approvedMockupPath).data.publicUrl;

    await Promise.all([
      supabaseAdmin.from("generated_previews").update({ is_approved: false }).eq("order_id", params.id),
      supabaseAdmin.from("generated_previews").update({ is_approved: true }).eq("id", previewId),
      supabaseAdmin
        .from("orders")
        .update({ approved_artwork_url: approvedArtworkUrl, approved_mockup_url: approvedMockupUrl })
        .eq("id", params.id)
    ]);
  }

  return (
    <main>
      <div className="card">
        <h1>Order {order.id}</h1>
        <div className="grid">
          <div>
            <strong>Customer</strong>
            <p>{order.customer_name}</p>
          </div>
          <div>
            <strong>Email</strong>
            <p>{order.customer_email}</p>
          </div>
          <div>
            <strong>Phone</strong>
            <p>{order.customer_phone ?? "-"}</p>
          </div>
          <div>
            <strong>Product</strong>
            <p>{order.product_name}</p>
          </div>
        </div>

        <h2>Shipping</h2>
        <p>
          {order.shipping_address_line_1}
          <br />
          {order.shipping_address_line_2 ? <>{order.shipping_address_line_2}<br /></> : null}
          {order.shipping_city}, {order.shipping_region} {order.shipping_postal_code}
          <br />
          {order.shipping_country}
        </p>

        <h2>Instructions</h2>
        <p>{order.general_instructions ?? "-"}</p>

        <h2>Approved Artwork</h2>
        <p>{order.approved_artwork_url ? <a href={order.approved_artwork_url}>Download approved artwork PNG</a> : "Not set"}</p>
        <p>{order.approved_mockup_url ? <a href={order.approved_mockup_url}>Download mockup PNG</a> : "Not set"}</p>

        <h2>Generated Previews</h2>
        {previews.length === 0 ? <p>No previews linked to this order yet.</p> : null}
        <ul>
          {previews.map((preview) => (
            <li key={preview.id} style={{ marginBottom: 14 }}>
              <a href={preview.artwork_url}>Artwork</a> | <a href={preview.mockup_url}>Mockup</a>
              {preview.is_approved ? " (Approved)" : ""}
              {!preview.is_approved ? (
                <form action={approvePreview} style={{ marginTop: 6 }}>
                  <input type="hidden" name="preview_id" value={preview.id} />
                  <button type="submit" className="secondary">Approve this preview</button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>

        <h2>Uploaded Photos</h2>
        <ul>
          {uploads.map((file) => (
            <li key={file.id}>
              <a href={file.file_url}>{file.file_name}</a>
            </li>
          ))}
        </ul>

        <h2>Update Status / Internal Notes</h2>
        <form action={updateOrder}>
          <label>Status</label>
          <select name="status" defaultValue={order.status}>
            <option>Submitted</option>
            <option>Reviewed</option>
            <option>In Production</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>

          <label>Internal Notes</label>
          <textarea name="internal_notes" rows={6} defaultValue={order.internal_notes ?? ""} />

          <button type="submit">Save</button>
        </form>
      </div>
    </main>
  );
}
