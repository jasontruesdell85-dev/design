import Link from "next/link";
import { AdminLoginForm } from "@/app/admin/AdminLoginForm";
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
          <AdminLoginForm />
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
