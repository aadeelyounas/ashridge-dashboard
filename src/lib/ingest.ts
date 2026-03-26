/**
 * Ingest script — run via cron or manually to sync markdown source files → Neon DB
 * Reads from /workspace/ashridge/ and upserts into the database
 */
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { contentQueue, geoScores, agentActivity, localSeoTracker, intelItems, pipelineItems, agentStatus } from "./schema";
import * as fs from "fs";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const ASHRIDGE_ROOT = "/root/.openclaw/workspace/ashridge";
const SQUAD_ROOT = "/root/.openclaw/workspace";
const LOCATIONS = ["London", "Milton Keynes", "Weybridge", "Basingstoke", "Manchester", "Scotland"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function read(file: string) {
  try {
    return fs.readFileSync(path.join(ASHRIDGE_ROOT, file), "utf8");
  } catch {
    return null;
  }
}

function readIntel(file: string) {
  try {
    return fs.readFileSync(path.join(SQUAD_ROOT, file), "utf8");
  } catch {
    return null;
  }
}

function parseMdTable(text: string, tableIndex = 0) {
  if (!text) return [];
  // Only include lines that start with | (actual table rows)
  const allLines = text.split("\n").map((l) => l.trim()).filter((l) => l && l.startsWith("|") && !l.startsWith("|---"));
  if (allLines.length < 2) return [];
  // Skip header rows (lines ending in |) until we hit the column header row
  const headerIdx = allLines.findIndex((l) => l.split("|").filter(Boolean).length >= 3);
  if (headerIdx < 0 || headerIdx >= allLines.length - 1) return [];
  const headers = allLines[headerIdx].split("|").map((h) => h.trim()).filter(Boolean);
  return allLines.slice(headerIdx + 1).map((line) => {
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] || ""));
    return row;
  });
}

// ── Ingest: Content Queue ──────────────────────────────────────────────────────

// Build a slug → content map from Oliver's draft files
function readDrafts(): Record<string, string> {
  const drafts: Record<string, string> = {};
  const draftsDir = path.join(ASHRIDGE_ROOT, "agents/oliver/memory/drafts");
  try {
    for (const file of fs.readdirSync(draftsDir)) {
      if (file.endsWith(".md")) {
        const slug = file.replace(/\.md$/, "");
        drafts[slug] = fs.readFileSync(path.join(draftsDir, file), "utf8");
      }
    }
  } catch {
    // No drafts dir yet
  }
  return drafts;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ingestContentQueue() {
  const md = read("intel/CONTENT-QUEUE.md");
  if (!md) { console.log("No CONTENT-QUEUE.md found"); return; }

  const drafts = readDrafts();
  const rows = parseMdTable(md).filter((r) => r["Page Title"] || r["Title"]);

  // Clear and re-insert for simplicity
  await db.delete(contentQueue);

  let withContent = 0;
  for (const row of rows) {
    const title = row["Page Title"] || row["Title"] || "";
    const slug = `2026-03-22-${slugify(title)}`;
    const content = drafts[slug] || null;

    await db.insert(contentQueue).values({
      pageTitle: title,
      targetKeyword: row["Target Keyword"] || "",
      priority: row["Priority"] || "MED",
      status: row["Status"] || row["Stage"] || "Not started",
      assignedTo: row["Assigned To"] || "",
      due: row["Due"] || "",
      notes: row["Notes"] || "",
      content: content,
    });
    if (content) withContent++;
  }
  console.log(`  Content queue: ${rows.length} rows (${withContent} with draft content)`);
}

// ── Ingest: GEO Intel ─────────────────────────────────────────────────────────

async function ingestGeo() {
  await db.delete(geoScores);
  const md = read("intel/GEO-INTEL.md");
  if (!md) { console.log("No GEO-INTEL.md found"); return; }

  const match = md.match(/Baseline.*?(\d+)/);
  const score = match ? parseInt(match[1]) : null;

  if (score !== null) {
    await db.insert(geoScores).values({ location: "Global", score, baseline: score });
    console.log(`  GEO score: ${score}`);
  }
}

// ── Ingest: Agent Activity ────────────────────────────────────────────────────

async function ingestAgentActivity(agentId: string, agentName: string, action: string, details?: string) {
  await db.insert(agentActivity).values({ agentId, agentName, action, details: details || null });
}

// ── Ingest: Local SEO ─────────────────────────────────────────────────────────

async function ingestLocalSeo() {
  await db.delete(localSeoTracker);
  const md = read("agents/marcus/memory/local-seo-tracker.md");
  if (!md) { console.log("No local-seo-tracker.md found"); return; }

  const lines = md.split("\n");
  for (const loc of LOCATIONS) {
    let hasPost = false;
    let reviewCount = 0;

    for (const line of lines) {
      if (line.includes(loc)) {
        if (line.includes("[x]") || line.includes("✅") || line.includes("yes")) hasPost = true;
        const m = line.match(/(\d+)\s*reviews?/i);
        if (m) reviewCount = parseInt(m[1]);
      }
    }

    await db.insert(localSeoTracker).values({ location: loc, gbpPost: hasPost, reviewCount });
  }
  console.log(`  Local SEO: ${LOCATIONS.length} locations`);
}

// ── Ingest: Intel Items ───────────────────────────────────────────────────────

async function ingestIntel() {
  await db.delete(intelItems);
  const md = readIntel("intel/DAILY-INTEL.md");
  if (!md) { console.log("No DAILY-INTEL.md found"); return; }

  const lines = md.split("\n");
  const today = new Date().toISOString().slice(0, 10);

  for (const line of lines) {
    const m = line.match(/^##\s+\d+\.\s+(.+)$/);
    if (m) {
      const topic = m[1].replace(/\*\*/g, "").trim();
      await db.insert(intelItems).values({
        section: today,
        topic,
        summary: null,
        source: null,
        priority: "HIGH",
      });
    }
  }
  console.log(`  Intel: parsed ${lines.filter((l) => l.match(/^##\s+\d+\./)).length} sections`);
}

// ── Ingest: Pipeline ─────────────────────────────────────────────────────────

async function ingestPipeline() {
  const md = read("intel/PIPELINE.md");
  if (!md) { console.log("No PIPELINE.md found"); return; }

  await db.delete(pipelineItems);

  // Detect WP-published drafts by checking published-ready/
  const pubDir = path.join(ASHRIDGE_ROOT, "memory/published-ready");
  const publishedSlugs = new Set<string>();
  try {
    for (const f of fs.readdirSync(pubDir)) {
      if (f.endsWith(".md")) {
        const slug = f.replace(/\.md$/, "");
        publishedSlugs.add(slug);
      }
    }
  } catch { /* dir doesn't exist yet */ }

  const lines = md.split("\n");
  let inTable = false;

  for (const line of lines) {
    if (line.includes("| Draft |")) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith("|---")) continue;
    if (inTable && line.startsWith("|") && !line.startsWith("|---")) {
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length < 4) continue;

      // Map columns: Draft, Oliver, Sophie, Aria, Victoria, Status
      const draft   = cells[0] || "";
      const oliver  = cells[1] || "";
      const sophie  = cells[2] || "";
      const aria    = cells[3] || "";
      const victoria = cells[4] || "";
      const status  = cells[5] || "";

      // Derive slug from filename: 2026-03-25-what-is-manned-guarding.md
      const slug = draft.replace(/\.md$/, "");
      const isPublished = publishedSlugs.has(slug) ||
        status.toLowerCase().includes("published") ||
        status.toLowerCase().includes("live");

      await db.insert(pipelineItems).values({
        draftSlug:    slug,
        draftTitle:   draft.replace(/-/g, " ").replace(/\d{4}-\d{2}-\d{2}-/g, ""),
        oliverStatus: oliver,
        sophieStatus: sophie,
        ariaStatus:   aria,
        victoriaStatus: victoria,
        overallStatus: status,
        wpPublishedAt: isPublished ? new Date() : null,
      });
    }
  }
  console.log(`  Pipeline: ingested active drafts`);
}

// ── Ingest: Agent Status ─────────────────────────────────────────────────────

async function ingestAgentStatus() {
  const md = read("intel/STATUS.md");
  if (!md) { console.log("No STATUS.md found"); return; }

  await db.delete(agentStatus);

  const lines = md.split("\n");
  for (const line of lines) {
    // Pattern: "AgentName | YYYY-MM-DD HH:MM | last action"
    const m = line.match(/^\|\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*\|\s*(.+?)\s*\|?\s*$/);
    if (m) {
      const [, agent, timestamp, action] = m;
      await db.insert(agentStatus).values({
        agentName: agent.trim(),
        lastAction: action.trim(),
        lastSeen: new Date(timestamp),
      });
    }
  }
  console.log(`  Agent status: updated`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🗄️  Ashridge Dashboard — Ingest\n---");

  await ingestContentQueue();
  await ingestGeo();
  await ingestLocalSeo();
  await ingestIntel();
  await ingestPipeline();
  await ingestAgentStatus();

  // Log this run
  await db.insert(agentActivity).values({
    agentId: "system",
    agentName: "Ingest",
    action: "cron_ingest",
    details: "Ingest script completed",
  });

  console.log("\n✅ Ingest complete\n");
}

main().catch(console.error);
