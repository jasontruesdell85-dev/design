export default function HomePage() {
  return (
    <main className="studio-shell">
      <section className="hero card">
        <p className="eyebrow">Memorial Product Studio</p>
        <h1>Design a Meaningful Tribute</h1>
        <p>
          Build a respectful memorial artwork preview, approve your design, and submit your request in a guided flow.
        </p>
        <p>
          <a href="/studio" className="cta-link">Open Studio</a>
        </p>
      </section>

      <section className="card">
        <h2>Admin Access</h2>
        <p>For order review and production workflow, use the admin dashboard.</p>
        <p>
          <a href="/admin" className="cta-link secondary-link">Go to Admin</a>
        </p>
      </section>
    </main>
  );
}
