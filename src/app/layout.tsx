import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menu Editor",
  description: "Edit menu copy and export a print-ready PDF.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
