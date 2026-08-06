"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Couldn't sign in.");
        setBusy(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 320,
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          padding: 28,
        }}
      >
        <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600 }}>Elsom Cellars</h1>
        <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: 13 }}>
          Enter the shared passcode to continue.
        </p>

        <label htmlFor="passcode">Passcode</label>
        <input
          id="passcode"
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          autoFocus
          autoComplete="current-password"
        />

        {error ? (
          <p style={{ color: "var(--danger)", fontSize: 13, margin: "10px 0 0" }} role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="primary"
          disabled={busy || passcode.length === 0}
          style={{ width: "100%", marginTop: 18 }}
        >
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
