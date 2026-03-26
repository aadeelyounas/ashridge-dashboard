import { db } from "@/lib/db";
import { contentQueue } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { ArrowLeft, Clock, User, Target, Bookmark } from "lucide-react";
import "@/app/globals.css";

function priorityClass(p: string) {
  const s = p.toLowerCase();
  if (s.includes("high")) return "tag-high";
  if (s.includes("low")) return "tag-low";
  return "tag-med";
}

/** Strip emoji characters from database strings (no-emoji-icons rule) */
function stripEmoji(str: string) {
  return str
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{FE0F}\u{200D}\u{20E3}\u{2705}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu,
      ""
    )
    .trim();
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try numeric ID first (content_queue rows)
  const postId = parseInt(id, 10);
  let post: typeof contentQueue.$inferSelect | null = null;

  if (!isNaN(postId)) {
    const rows = await db.select().from(contentQueue).where(eq(contentQueue.id, postId)).limit(1);
    post = rows[0] || null;
  }

  // Fallback: slug-based lookup from pipeline_items
  if (!post) {
    const slug = id;
    const slugified = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const all = await db.select().from(contentQueue).limit(500);
    post = all.find(row =>
      slugified(row.pageTitle || "") === slug ||
      slugified(row.targetKeyword || "") === slug
    ) || null;
  }

  if (!post) return notFound();

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
          <h1 style={{ marginBottom: "var(--space-1)" }}>{post.pageTitle || "Draft Content"}</h1>
          <p style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Target size={14} /> {post.targetKeyword}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <User size={14} /> {post.assignedTo || "Unassigned"}
            </span>
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Generated Content</h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Status: <strong style={{ color: "var(--text-primary)" }}>{post.status ? stripEmoji(post.status) : "Not started"}</strong>
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
            {post.due && (
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: 13, color: "var(--text-muted)" }}>
                <Clock size={14} /> Due {post.due}
              </span>
            )}
            <span className={`tag ${priorityClass(post.priority || "")}`}>
              {post.priority || "MED"} Priority
            </span>
          </div>
        </div>
        
        <div className="card-body">
          <article className="markdown-body">
            {post.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <Bookmark />
                </div>
                No content drafted yet.
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
