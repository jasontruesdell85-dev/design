import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function fetchOrders() {
  const { data } = await supabaseAdmin
    .from("orders")
    .select("id, created_at, customer_name, customer_email, customer_phone, product_name, status")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return (
      <main>
        <div className="card" style={{ maxWidth: 420, margin: "40px auto" }}>
          <h1>Admin Login</h1>
          <form action="/api/admin/login" method="post" onSubmit="">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required />
            <button type="submit">Login</button>
          </form>
          <p style={{ fontSize: 14, opacity: 0.75 }}>
            Submit sends JSON through a quick script in the browser console for now.
          </p>
          <script
            dangerouslySetInnerHTML={{
              __html: `
const form = document.currentScript?.previousElementSibling;
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = form.password.value;
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) window.location.reload();
    else alert('Invalid password');
  });
}
`
            }}
          />
        </div>
      </main>
    );
  }

  const orders = await fetchOrders();

  return (
    <main>
      <div className="card">
        <h1>Orders</h1>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Product</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/admin/orders/${order.id}`}>{order.id}</Link>
                </td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>{order.customer_name}</td>
                <td>{order.customer_email}</td>
                <td>{order.customer_phone ?? "-"}</td>
                <td>{order.product_name}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
