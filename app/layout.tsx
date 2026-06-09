import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rayfel Admin",
  description: "Rayfel Erasmus+ İçerik Yönetim Paneli",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>
          <header style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 0",
            borderBottom: "1px solid var(--border)",
            marginBottom: 32,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 28, height: 28, background: "var(--accent)",
                borderRadius: 7, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff",
              }}>R</div>
              <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>
                Rayfel Admin
              </span>
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "DM Mono, monospace" }}>
              local tool
            </span>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
