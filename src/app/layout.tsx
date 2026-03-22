import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ashridge Dashboard — SEO/GEO Operations",
  description:
    "Ashridge Group SEO/GEO Operations Dashboard — Content Pipeline, GEO Visibility, Local SEO & Agent Activity",
};

import {
  Building2,
  ClipboardList,
  Globe,
  MapPin,
  Bot,
  Brain,
} from "lucide-react";

const AGENTS = [
  { id: "victoria", name: "Victoria", role: "SEO & GEO Lead", color: "#2563eb" },
  { id: "atlas", name: "Atlas", role: "Topical Map Builder", color: "#8b5cf6" },
  { id: "quinn", name: "Quinn", role: "Query Gap Analyst", color: "#f59e0b" },
  { id: "aria", name: "Aria", role: "Content Auditor", color: "#22c55e" },
  { id: "oliver", name: "Oliver", role: "Content Writer", color: "#ef4444" },
  { id: "sophie", name: "Sophie", role: "Brand Voice", color: "#ec4899" },
  { id: "grace", name: "Grace", role: "GEO / AI Visibility", color: "#3b82f6" },
  { id: "marcus", name: "Marcus", role: "Local SEO", color: "#f97316" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="dashboard-layout">
          {/* ── Sidebar ────────────────────────────────────────────── */}
          <aside className="sidebar" aria-label="Main navigation">
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon" aria-hidden="true">
                <Building2 size={20} strokeWidth={1.75} />
              </div>
              <div>
                <div className="sidebar-logo-text">Ashridge Group</div>
                <div className="sidebar-logo-sub">SEO / GEO Dashboard</div>
              </div>
            </div>

            <nav className="nav-section" aria-label="Operations navigation">
              <div className="nav-label" id="nav-ops-label">Operations</div>
              <div role="list" aria-labelledby="nav-ops-label">
                <a href="/#pipeline" className="nav-link active" role="listitem">
                  <ClipboardList aria-hidden="true" /> Content Pipeline
                </a>
                <a href="/#geo" className="nav-link" role="listitem">
                  <Globe aria-hidden="true" /> GEO Score
                </a>
                <a href="/#seo" className="nav-link" role="listitem">
                  <MapPin aria-hidden="true" /> Local SEO
                </a>
                <a href="/#agents" className="nav-link" role="listitem">
                  <Bot aria-hidden="true" /> Agent Activity
                </a>
                <a href="/#intel" className="nav-link" role="listitem">
                  <Brain aria-hidden="true" /> Intel Feed
                </a>
              </div>
            </nav>

            <div className="nav-section">
              <div className="nav-label">Team</div>
              {AGENTS.map((ag) => (
                <div
                  key={ag.id}
                  className="nav-link"
                  style={{ opacity: 0.85, fontSize: 12 }}
                >
                  <span
                    className="nav-dot"
                    style={{ background: ag.color }}
                    aria-hidden="true"
                  />
                  {ag.name} — {ag.role}
                </div>
              ))}
            </div>

            <div className="sidebar-footer">
              <div className="status-indicator">
                <span className="status-dot" aria-hidden="true" />
                <span>Auto-refresh: 60s</span>
              </div>
              <div style={{ marginTop: 4 }}>Data: Neon PostgreSQL</div>
            </div>
          </aside>

          {/* ── Main ───────────────────────────────────────────────── */}
          <main className="main-content" id="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
