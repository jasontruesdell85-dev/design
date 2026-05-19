import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getOrder(id: string) {
  const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", id).single();
  const { data: uploads } = await supabaseAdmin.from("uploaded_files").select("*").eq("order_id", id);
  return { order, uploads: uploads ?? [] };
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  const { order, uploads } = await getOrder(params.id);
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
