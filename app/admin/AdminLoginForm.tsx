"use client";

import { useState } from "react";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (!res.ok) {
      setError("Invalid password");
      return;
    }

    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="password">Password</label>
      <input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
      <button type="submit">Login</button>
      {error ? <p style={{ color: "#9d2f2f" }}>{error}</p> : null}
    </form>
  );
}
