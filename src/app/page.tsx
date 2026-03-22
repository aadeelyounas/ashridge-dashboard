"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  CheckCircle2,
  Bot,
  Globe,
  ClipboardList,
  MapPin,
  Brain,
  Inbox,
  Search,
  X,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────── */

interface PipelineItem {
  id: number;
  pageTitle: string;
  targetKeyword: string;
  priority: string;
  status: string;
  assignedTo: string;
  due: string;
  notes: string;
  content?: string;
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
  agentId: string;
  agentName: string;
  action: string;
  details: string;
  ranAt: string;
}

interface LocalSeo {
  id: number;
  location: string;
  gbpPost: boolean;
  reviewCount: number;
  trackedAt: string;
}

interface IntelItem {
  id: number;
  section: string;
  topic: string;
  summary: string | null;
  source: string | null;
  priority: string;
  recordedAt: string;
}

/* ── Constants ──────────────────────────────────────────────────────── */

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

const LOCATIONS = [
  "London",
  "Milton Keynes",
  "Weybridge",
  "Basingstoke",
  "Manchester",
  "Scotland",
];

/* ── Helpers ─────────────────────────────────────────────────────────── */

/** Strip emoji characters from database strings (no-emoji-icons rule) */
function stripEmoji(str: string) {
  return str
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{FE0F}\u{200D}\u{20E3}\u{2705}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu,
      ""
    )
    .trim();
}

function stageClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("publish")) return "stage-published";
  if (
    s.includes("adeel") ||
    s.includes("victoria") ||
    s.includes("sophie")
  )
    return "stage-review";
  if (s.includes("aria") || s.includes("audit")) return "stage-audit";
  if (
    s.includes("oliver") ||
    s.includes("draft") ||
    s.includes("writing")
  )
    return "stage-writing";
  return "stage-queuing";
}

function priorityClass(p: string) {
  const s = p.toLowerCase();
  if (s.includes("high")) return "tag-high";
  if (s.includes("low")) return "tag-low";
  return "tag-med";
}

function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── GEO Progress Ring ───────────────────────────────────────────────── */

function GeoRing({ score, max = 100 }: { score: number; max?: number }) {
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="geo-ring-wrapper" role="img" aria-label={`GEO score: ${score} out of ${max}`}>
      <svg className="geo-ring" viewBox="0 0 160 160" aria-hidden="true">
        <defs>
          <linearGradient id="geoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <circle className="geo-ring-bg" cx="80" cy="80" r={radius} />
        <circle
          className="geo-ring-fill"
          cx="80"
          cy="80"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="geo-value">
        <div className="number">{score}</div>
        <div className="label">out of {max}</div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [geo, setGeo] = useState<GeoScore[]>([]);
  const [agents, setAgents] = useState<AgentActivity[]>([]);
  const [seo, setSeo] = useState<LocalSeo[]>([]);
  const [intel, setIntel] = useState<IntelItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAll() {
    try {
      const [p, g, a, s, i] = await Promise.all([
        fetch("/api/pipeline").then((r) => r.json()),
        fetch("/api/geo").then((r) => r.json()),
        fetch("/api/agents").then((r) => r.json()),
        fetch("/api/seo").then((r) => r.json()),
        fetch("/api/intel").then((r) => r.json()),
      ]);
      setPipeline(Array.isArray(p) ? p : []);
      setGeo(Array.isArray(g) ? g : []);
      setAgents(Array.isArray(a) ? a : []);
      setSeo(Array.isArray(s) ? s : []);
      setIntel(Array.isArray(i) ? i : []);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const id = setInterval(fetchAll, 60000);
    return () => clearInterval(id);
  }, []);

  const latestGeo = geo[geo.length - 1];
  const publishedCount = pipeline.filter(
    (p) => p.status?.toLowerCase().includes("publish")
  ).length;
  const uniqueAgents = new Set(agents.map((a) => a.agentId)).size;
  const maxReviews = Math.max(...seo.map((s) => s.reviewCount || 0), 1);

  return (
    <>
      <div className="page-header">
        <h1>Ashridge Dashboard</h1>
          <p suppressHydrationWarning>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {loading ? (
          <div className="skeleton" aria-label="Loading dashboard data">
            <div className="skeleton-row">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="skeleton-kpi" />
              ))}
            </div>
            <div className="skeleton-card" />
            <div className="skeleton-card" style={{ height: 160 }} />
          </div>
        ) : (
          <>
            {/* ── KPI Cards ──────────────────────────────────── */}
            <div className="kpi-grid" role="list" aria-label="Key metrics">
              <div className="kpi-card" role="listitem">
                <div className="kpi-icon kpi-icon--blue" aria-hidden="true">
                  <FileText />
                </div>
                <div className="kpi-value">{pipeline.length}</div>
                <div className="kpi-label">Total Pages</div>
              </div>
              <div className="kpi-card" role="listitem">
                <div className="kpi-icon kpi-icon--green" aria-hidden="true">
                  <CheckCircle2 />
                </div>
                <div className="kpi-value">{publishedCount}</div>
                <div className="kpi-label">Published</div>
              </div>
              <div className="kpi-card" role="listitem">
                <div className="kpi-icon kpi-icon--purple" aria-hidden="true">
                  <Bot />
                </div>
                <div className="kpi-value">{uniqueAgents}</div>
                <div className="kpi-label">Active Agents</div>
              </div>
              <div className="kpi-card" role="listitem">
                <div className="kpi-icon kpi-icon--amber" aria-hidden="true">
                  <Globe />
                </div>
                <div className="kpi-value">{latestGeo?.score ?? "—"}</div>
                <div className="kpi-label">GEO Score</div>
              </div>
            </div>

            {/* ── Content Pipeline ────────────────────────────── */}
            <section id="pipeline" aria-labelledby="pipeline-title">
              <div className="card" style={{ animationDelay: "100ms" }}>
                <div className="card-header">
                  <span className="card-title" id="pipeline-title">
                    <ClipboardList aria-hidden="true" /> Content Pipeline
                  </span>
                  <span className="card-badge">{pipeline.length} pages</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {pipeline.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <Inbox />
                      </div>
                      No pages in queue — Victoria sets priorities each Monday
                    </div>
                  ) : (
                    <table className="pipeline-table" aria-label="Content pipeline items">
                      <thead>
                        <tr>
                          <th scope="col">Page</th>
                          <th scope="col">Priority</th>
                          <th scope="col">Stage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pipeline.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => router.push(`/post/${item.id}`)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                router.push(`/post/${item.id}`);
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`View details for ${item.pageTitle || "untitled"}`}
                          >
                            <td>
                              <div className="page-title">
                                {item.pageTitle || "(untitled)"}
                              </div>
                              <div className="page-keyword">
                                {item.targetKeyword}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`tag ${priorityClass(item.priority)}`}
                              >
                                {item.priority}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`stage ${stageClass(item.status)}`}
                              >
                                {stripEmoji(item.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>

            {/* ── GEO + Agents Row ─────────────────────────────── */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
              <section id="geo" aria-labelledby="geo-title">
                <div className="card" style={{ animationDelay: "200ms" }}>
                  <div className="card-header">
                    <span className="card-title" id="geo-title">
                      <Globe aria-hidden="true" /> GEO / AI Visibility
                    </span>
                  </div>
                  <div className="card-body">
                    {latestGeo ? (
                      <div className="geo-container">
                        <GeoRing score={latestGeo.score} />
                        <div className="geo-meta">
                          Baseline: <strong>{latestGeo.baseline}</strong>{" "}
                          &nbsp;·&nbsp;
                          {latestGeo.location}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <Search />
                        </div>
                        No GEO data yet — Grace is running baseline audit
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section id="agents" aria-labelledby="agents-title">
                <div className="card" style={{ animationDelay: "250ms" }}>
                  <div className="card-header">
                    <span className="card-title" id="agents-title">
                      <Bot aria-hidden="true" /> Agent Activity
                    </span>
                    <span className="card-badge">{agents.length} events</span>
                  </div>
                  <div className="card-body">
                    {agents.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <Bot />
                        </div>
                        No recent activity
                      </div>
                    ) : (
                      <div className="agent-timeline" role="list" aria-label="Recent agent activity">
                        {agents.slice(0, 8).map((ag) => (
                          <div key={ag.id} className="agent-entry" role="listitem">
                            <span
                              className="agent-dot"
                              style={{
                                background:
                                  AGENTS.find((a) => a.id === ag.agentId)
                                    ?.color || "var(--text-muted)",
                              }}
                              aria-hidden="true"
                            />
                            <span className="agent-name">{ag.agentName}</span>
                            <span className="agent-action">{ag.action}</span>
                            <time className="agent-time" dateTime={ag.ranAt}>
                              {timeAgo(ag.ranAt)}
                            </time>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* ── Local SEO ────────────────────────────────────── */}
            <section id="seo" aria-labelledby="seo-title">
              <div className="card" style={{ animationDelay: "300ms" }}>
                <div className="card-header">
                  <span className="card-title" id="seo-title">
                    <MapPin aria-hidden="true" /> Local SEO — GBP
                  </span>
                  <span className="card-badge">
                    {LOCATIONS.length} locations
                  </span>
                </div>
                <div className="card-body">
                  <div className="seo-grid" role="list" aria-label="Local SEO by location">
                    {LOCATIONS.map((loc) => {
                      const entry = seo.find((s) => s.location === loc);
                      return (
                        <div key={loc} className="seo-card" role="listitem">
                          <div className="seo-location">
                            <MapPin aria-hidden="true" />
                            {loc}
                          </div>
                          <div className="seo-row">
                            <span className="seo-label">GBP Post</span>
                            <span
                              className={`seo-status ${entry?.gbpPost ? "active" : "inactive"}`}
                            >
                              {entry?.gbpPost ? "Active" : "—"}
                            </span>
                          </div>
                          <div className="seo-row">
                            <span className="seo-label">Reviews</span>
                            <span>
                              <span
                                className="review-bar-wrapper"
                                role="progressbar"
                                aria-valuenow={entry?.reviewCount || 0}
                                aria-valuemax={maxReviews}
                                aria-label={`${entry?.reviewCount || 0} reviews`}
                              >
                                <span
                                  className="review-bar"
                                  style={{
                                    width: `${((entry?.reviewCount || 0) / maxReviews) * 100}%`,
                                  }}
                                />
                              </span>
                              <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                                {entry?.reviewCount ?? 0}
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Intel Feed ───────────────────────────────────── */}
            <section id="intel" aria-labelledby="intel-title">
              <div className="card" style={{ animationDelay: "350ms" }}>
                <div className="card-header">
                  <span className="card-title" id="intel-title">
                    <Brain aria-hidden="true" /> Intel Feed
                  </span>
                  <span className="card-badge">{intel.length} items</span>
                </div>
                <div className="card-body">
                  {intel.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <Brain />
                      </div>
                      No intel items — agents are collecting data
                    </div>
                  ) : (
                    <div className="intel-grid" role="list" aria-label="Intelligence feed items">
                      {intel.slice(0, 10).map((item) => (
                        <div key={item.id} className="intel-item" role="listitem">
                          <div className="intel-topic">{item.topic}</div>
                          <div className="intel-meta">
                            <span
                              className={`tag ${priorityClass(item.priority)}`}
                            >
                              {item.priority}
                            </span>
                            <span>{item.section}</span>
                            {item.source && <span>· {item.source}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        <footer className="footer">
          Ashridge Group SEO/GEO Operations &nbsp;·&nbsp; Neon PostgreSQL
          &nbsp;·&nbsp; Last updated:{" "}
          <time suppressHydrationWarning>{new Date().toLocaleTimeString()}</time>
        </footer>
    </>
  );
}
