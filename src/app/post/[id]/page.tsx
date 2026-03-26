import { db } from "@/lib/db";
import { contentQueue } from "@/lib/schema";
import { pipelineItems } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { ArrowLeft, Clock, User, Target, Bookmark } from "lucide-react";
import "@/app/globals.css";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const DRAFTS_ROOT = "/root/.openclaw/workspace/ashridge/memory/drafts";

function priorityClass(p: string) {
  const s = p.toLowerCase();
  if (s.includes("high")) return "tag-high";
  if (s.includes("low")) return "tag-low";
  return "tag-med";
}

function stripEmoji(str: string) {
  return str
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{FE0F}\u{200D}\u{20E3}\u{2705}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu,
      ""
    )
    .trim();
}

function slugToDraftPath(slug: string): string | null {
  // Try exact slug → .md
  const exact = join(DRAFTS_ROOT, `${slug}.md`);
  if (existsSync(exact)) return exact;
  // Try without date prefix: strip leading YYYY-MM-DD- from slug
  const noDate = slug.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  const withoutDate = join(DRAFTS_ROOT, `${noDate}.md`);
  if (existsSync(withoutDate)) return withoutDate;
  return null;
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let pageTitle = "";
  let targetKeyword = "";
  let status = "";
  let assignedTo = "";
  let due = "";
  let priority = "";
  let content: string | null = null;
  let source = "";

  // 1. Try numeric ID in content_queue
  const postId = parseInt(id, 10);
  if (!isNaN(postId)) {
    const rows = await db.select().from(contentQueue).where(eq(contentQueue.id, postId)).limit(1);
    if (rows[0]) {
      const row = rows[0];
      pageTitle = row.pageTitle || "";
      targetKeyword = row.targetKeyword || "";
      status = row.status || "";
      assignedTo = row.assignedTo || "";
      due = row.due || "";
      priority = row.priority || "";
      content = row.content || null;
      source = "database";
    }
  }

  // 2. Fallback: slug-based lookup in content_queue
  if (!pageTitle) {
    const slug = id.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const noDateSlug = slug.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    const all = await db.select().from(contentQueue).limit(500);
    const match = all.find(row => {
      const t = (row.pageTitle || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const k = (row.targetKeyword || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      return t === slug || t === noDateSlug || k === slug || k === noDateSlug;
    });
    if (match) {
      pageTitle = match.pageTitle || "";
      targetKeyword = match.targetKeyword || "";
      status = match.status || "";
      assignedTo = match.assignedTo || "";
      due = match.due || "";
      priority = match.priority || "";
      content = match.content || null;
      source = "database-slug";
    }
  }

  // 3. Final fallback: read draft file from disk
  if (!content) {
    const draftPath = slugToDraftPath(id);
    if (draftPath) {
      try {
        content = readFileSync(draftPath, "utf8");
        pageTitle = pageTitle || id.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/-/g, " ");
        status = "Draft on disk";
        source = "filesystem";
      } catch {
        // file unreadable
      }
    }
  }

  if (!pageTitle && !content) return notFound();

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      <div className="page-header" style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        <Link
          href="/"
          className="back-link"
          style={{ marginBottom: 0, padding: "8px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1 style={{ marginBottom: "var(--space-1)" }}>{pageTitle || "Draft Content"}</h1>
          <p style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
            {targetKeyword && (
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Target size={14} /> {targetKeyword}
              </span>
            )}
            {assignedTo && (
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <User size={14} /> {assignedTo}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Generated Content</h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Status: <strong style={{ color: "var(--text-primary)" }}>{status ? stripEmoji(status) : "Not started"}</strong>
              {source && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-muted)" }}>({source})</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
            {due && (
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: 13, color: "var(--text-muted)" }}>
                <Clock size={14} /> Due {due}
              </span>
            )}
            {priority && (
              <span className={`tag ${priorityClass(priority)}`}>
                {priority} Priority
              </span>
            )}
          </div>
        </div>

        <div className="card-body">
          <article className="markdown-body">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><Bookmark /></div>
                No content drafted yet.
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
