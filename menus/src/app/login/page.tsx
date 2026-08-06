"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorIcon } from "@/components/Icon";
import { ElsomLogo } from "@/components/Logo";

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
        className="md-card"
        style={{ width: "100%", maxWidth: 360, padding: 32 }}
      >
        {/*
          Decorative: the heading directly below already reads "Elsom Cellars",
          and without this a screen reader announces the name twice.
        */}
        <div style={{ marginBottom: 20, color: "var(--elsom-gold)" }}>
          <ElsomLogo height={52} decorative />
        </div>

        <h1 className="md-display-medium" style={{ marginBottom: 4 }}>
          Elsom Cellars
        </h1>
        <p className="md-body-medium md-on-surface-variant" style={{ marginBottom: 28 }}>
          Enter the shared passcode to continue.
        </p>

        <div className="md-field">
          <input
            id="passcode"
            type="password"
            placeholder=" "
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            autoFocus
            autoComplete="current-password"
            aria-describedby={error ? "passcode-error" : undefined}
          />
          <label htmlFor="passcode">Password</label>
        </div>

        {error ? (
          <div
            id="passcode-error"
            role="alert"
            className="md-body-small"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              margin: "8px 4px 0",
              color: "var(--md-sys-color-error)",
            }}
          >
            <ErrorIcon size="sm" />
            <span>{error}</span>
          </div>
        ) : null}

        <button
          type="submit"
          className="md-button filled"
          disabled={busy || passcode.length === 0}
          style={{ width: "100%", marginTop: 24 }}
        >
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
