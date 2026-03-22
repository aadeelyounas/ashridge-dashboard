"use client";

import { useEffect, useState } from "react";

interface PipelineItem {
  id: number;
  pageTitle: string;
  target_keyword: string;
  priority: string;
  status: string;
  assigned_to: string;
  due: string;
  notes: string;
}

interface GeoScore {
  id: number;
  location: string;
  score: number;
  baseline: number;
  trackedAt: string;
}

interface AgentActivity {
  id: number;
  agent_id: string;
  agent_name: string;
  action: string;
  details: string;
  ranAt: string;
}

interface LocalSeo {
  id: number;
  location: string;
  gbp_post: boolean;
  review_count: number;
  trackedAt: string;
}

const AGENTS = [
  { id: "victoria", name: "Victoria", role: "SEO & GEO Lead", color: "#6c8cff" },
  { id: "atlas", name: "Atlas", role: "Topical Map Builder", color: "#c084fc" },
  { id: "quinn", name: "Quinn", role: "Query Gap Analyst", color: "#ffc04d" },
  { id: "aria", name: "Aria", role: "Content Auditor", color: "#4ade80" },
  { id: "oliver", name: "Oliver", role: "Content Writer", color: "#ff6b6b" },
  { id: "sophie", name: "Sophie", role: "Brand Voice", color: "#db2777" },
  { id: "grace", name: "Grace", role: "GEO / AI Visibility", color: "#3b82f6" },
  { id: "marcus", name: "Marcus", role: "Local SEO", color: "#ffc04d" },
];

const LOCATIONS = ["London", "Milton Keynes", "Weybridge", "Basingstoke", "Manchester", "Scotland"];

function stageClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("publish")) return "stage-published";
  if (s.includes("adeel") || s.includes("victoria")) return "stage-review";
  if (s.includes("sophie")) return "stage-review";
  if (s.includes("aria") || s.includes("audit")) return "stage-audit";
  if (s.includes("oliver") || s.includes("draft") || s.includes("writing")) return "stage-writing";
  return "stage-queuing";
}

function priorityClass(p: string) {
  const s = p.toLowerCase();
  if (s.includes("high")) return "tag-high";
  if (s.includes("low")) return "tag-low";
  return "tag-med";
}

export default function DashboardPage() {
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [geo, setGeo] = useState<GeoScore[]>([]);
  const [agents, setAgents] = useState<AgentActivity[]>([]);
  const [seo, setSeo] = useState<LocalSeo[]>([]);
  const [selectedItem, setSelectedItem] = useState<PipelineItem | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    try {
      const [p, g, a, s] = await Promise.all([
        fetch("/api/pipeline").then((r) => r.json()),
        fetch("/api/geo").then((r) => r.json()),
        fetch("/api/agents").then((r) => r.json()),
        fetch("/api/seo").then((r) => r.json()),
      ]);
      setPipeline(p);
      setGeo(g);
      setAgents(a);
      setSeo(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    const id = setInterval(fetchAll, 60000);
    return () => clearInterval(id);
  }, []);

  const latestGeo = geo[geo.length - 1];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏢</div>
          <div>
            <div className="sidebar-logo-text">Ashridge Group</div>
            <div className="sidebar-logo-sub">SEO / GEO Dashboard</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">Operations</div>
          <a href="#pipeline" className="nav-link active">📋 Content Pipeline</a>
          <a href="#geo" className="nav-link">🌍 GEO Score</a>
          <a href="#seo" className="nav-link">📍 Local SEO</a>
          <a href="#agents" className="nav-link">🤖 Agent Activity</a>
        </div>

        <div className="nav-section">
          <div className="nav-label">Team</div>
          {AGENTS.map((ag) => (
            <div key={ag.id} className="nav-link" style={{ opacity: 0.7, fontSize: 12 }}>
              <span className="nav-dot" style={{ background: ag.color }} />
              {ag.name} — {ag.role}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 24, fontSize: 11, color: "var(--muted)" }}>
          Auto-refresh: 60s<br />
          Data: Neon PostgreSQL
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Ashridge Dashboard</h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {loading ? (
          <div style={{ color: "var(--muted)", padding: 40, textAlign: "center" }}>Loading...</div>
        ) : (
          <>
            {/* Content Pipeline */}
            <section id="pipeline">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Content Pipeline</span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{pipeline.length} pages</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {pipeline.length === 0 ? (
                    <div style={{ padding: "40px 18px", textAlign: "center", color: "var(--muted)" }}>
                      No pages in queue — Victoria sets priorities each Monday
                    </div>
                  ) : (
                    <table className="pipeline-table">
                      <thead>
                        <tr>
                          <th>Page</th>
                          <th>Priority</th>
                          <th>Stage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pipeline.map((item) => (
                          <tr key={item.id} onClick={() => setSelectedItem(item)}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{item.pageTitle || "(untitled)"}</div>
                              <div style={{ color: "var(--muted)", fontSize: 12 }}>{item.targetKeyword}</div>
                            </td>
                            <td>
                              <span className={`tag ${priorityClass(item.priority)}`}>{item.priority}</span>
                            </td>
                            <td>
                              <span className={`stage ${stageClass(item.status)}`}>{item.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>

            {/* GEO + Stats row */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
              {/* GEO Score */}
              <section id="geo">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">🌍 GEO / AI Visibility</span>
                  </div>
                  <div className="card-body" style={{ textAlign: "center", padding: "2rem" }}>
                    {latestGeo ? (
                      <>
                        <div className="geo-big">
                          {latestGeo.score}<span>/100</span>
                        </div>
                        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>
                          Baseline: {latestGeo.baseline} &nbsp;|&nbsp;
                          {latestGeo.location}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: "var(--muted)", padding: "2rem" }}>No GEO data yet — Grace is running baseline audit</div>
                    )}
                  </div>
                </div>
              </section>

              {/* Agent Activity */}
              <section id="agents">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">🤖 Agent Activity</span>
                  </div>
                  <div className="card-body">
                    {agents.length === 0 ? (
                      <div style={{ color: "var(--muted)" }}>No recent activity</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {agents.slice(-8).reverse().map((ag) => (
                          <div key={ag.id} style={{ display: "flex", gap: 12, fontSize: 13, alignItems: "center" }}>
                            <span style={{
                              width: 8, height: 8, borderRadius: "50%",
                              background: AGENTS.find((a) => a.id === ag.agent_id)?.color || "var(--muted)",
                              flexShrink: 0,
                            }} />
                            <span style={{ fontWeight: 600, minWidth: 80 }}>{ag.agent_name}</span>
                            <span style={{ color: "var(--muted)" }}>{ag.action}</span>
                            <span style={{ color: "var(--muted)", marginLeft: "auto", fontSize: 11 }}>
                              {new Date(ag.ranAt).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Local SEO */}
            <section id="seo">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">📍 Local SEO — GBP</span>
                </div>
                <div className="card-body">
                  <div className="grid-3">
                    {LOCATIONS.map((loc) => {
                      const entry = seo.find((s) => s.location === loc);
                      return (
                        <div key={loc} style={{
                          background: "var(--surface2)",
                          borderRadius: 8,
                          padding: "12px 16px",
                          border: "1px solid var(--border)",
                        }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{loc}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                            <div>
                              <span style={{ color: "var(--muted)" }}>GBP post: </span>
                              <span style={{ color: entry?.gbp_post ? "var(--green)" : "var(--muted)" }}>
                                {entry?.gbp_post ? "✅ Yes" : "❌ No"}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: "var(--muted)" }}>Reviews: </span>
                              <span>{entry?.review_count ?? "—"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Article Detail Modal */}
        <div className={`modal-overlay ${selectedItem ? "open" : ""}`} onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{selectedItem?.pageTitle || "Article"}</div>
              <button className="modal-close" onClick={() => setSelectedItem(null)}>×</button>
            </div>
            <div className="modal-body">
              {[
                ["Keyword", selectedItem?.target_keyword],
                ["Priority", selectedItem?.priority],
                ["Status", selectedItem?.status],
                ["Assigned", selectedItem?.assigned_to],
                ["Due", selectedItem?.due],
                ["Notes", selectedItem?.notes],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="modal-row">
                  <div className="modal-label">{label}</div>
                  <div className="modal-value">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="footer">
          Ashridge Group SEO/GEO Operation &nbsp;|&nbsp; Neon PostgreSQL &nbsp;|&nbsp; Updated: {new Date().toLocaleTimeString()}
        </div>
      </main>
    </div>
  );
}
