import Link from "next/link";
import { MENUS } from "@/menus/registry";
import { SignOutButton } from "@/components/SignOutButton";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 600 }}>Menus</h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
            Pick a menu to edit its text and export a PDF.
          </p>
        </div>
        <SignOutButton />
      </header>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
        {MENUS.map((menu) => (
          <li key={menu.id}>
            <Link
              href={`/edit/${menu.id}`}
              style={{
                display: "block",
                padding: "18px 20px",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600 }}>{menu.label}</span>
              <span style={{ display: "block", color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                {menu.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
