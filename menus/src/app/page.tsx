import Link from "next/link";
import { MENUS } from "@/menus/registry";
import { ChevronRightIcon, MenuBookIcon } from "@/components/Icon";
import { ElsomLogo } from "@/components/Logo";

export default function HomePage() {
  return (
    <>
      <header className="md-top-app-bar">
        {/* The logotype replaces the title slot. `role="img"` on the SVG keeps
            "Elsom Cellars" as the heading's accessible name. */}
        <h1 style={{ margin: "0 0 0 16px", display: "flex", color: "var(--elsom-gold)" }}>
          <ElsomLogo height={36} />
        </h1>
      </header>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 64px" }}>
        <h2 className="md-display-large" style={{ marginBottom: 8 }}>
          Menus
        </h2>
        <p className="md-body-large md-on-surface-variant" style={{ marginBottom: 32 }}>
          Pick a menu to see how it will print and export a PDF. The content
          itself lives in the spreadsheet.
        </p>

        <ul className="md-card" style={{ listStyle: "none", margin: 0, padding: 8 }}>
          {MENUS.map((menu, index) => (
            <li key={menu.id}>
              {index > 0 ? <hr className="md-divider" style={{ margin: "4px 16px" }} /> : null}
              <Link href={`/menu/${menu.id}`} className="md-list-item">
                <span className="leading">
                  <MenuBookIcon />
                </span>
                <span style={{ flexGrow: 1 }}>
                  <span className="md-title-medium" style={{ display: "block" }}>
                    {menu.label}
                  </span>
                  <span className="md-body-medium md-on-surface-variant" style={{ display: "block" }}>
                    {menu.description}
                  </span>
                </span>
                <ChevronRightIcon />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
