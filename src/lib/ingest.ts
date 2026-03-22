/**
 * Ingest script — run via cron or manually to sync markdown source files → Neon DB
 * Reads from /workspace/ashridge/ and upserts into the database
 */
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { contentQueue, geoScores, agentActivity, localSeoTracker, intelItems } from "./schema";
import * as fs from "fs";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const ASHRIDGE_ROOT = "/root/.openclaw/workspace/workspace/ashridge";
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

function parseMdTable(text: string) {
  if (!text) return [];
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && !l.startsWith("|---"));
  if (lines.length < 2) return [];
  const headers = lines[0].split("|").map((h) => h.trim()).filter(Boolean);
  return lines.slice(1).map((line) => {
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] || ""));
    return row;
  });
}

// ── Ingest: Content Queue ──────────────────────────────────────────────────────

async function ingestContentQueue() {
  const md = read("intel/CONTENT-QUEUE.md");
  if (!md) { console.log("No CONTENT-QUEUE.md found"); return; }

  const rows = parseMdTable(md).filter((r) => r["Page Title"] || r["Title"]);

  for (const row of rows) {
    const existing = await db.select().from(contentQueue).limit(1);
    // Upsert logic: clear and re-insert for now (replace all each run)
  }

  // Clear and re-insert for simplicity
  await db.delete(contentQueue);

  for (const row of rows) {
    await db.insert(contentQueue).values({
      pageTitle: row["Page Title"] || row["Title"] || "",
      targetKeyword: row["Target Keyword"] || "",
      priority: row["Priority"] || "MED",
      status: row["Status"] || row["Stage"] || "Not started",
      assignedTo: row["Assigned To"] || "",
      due: row["Due"] || "",
      notes: row["Notes"] || "",
    });
  }
  console.log(`  Content queue: ${rows.length} rows`);
}

// ── Ingest: GEO Intel ─────────────────────────────────────────────────────────

async function ingestGeo() {
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

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🗄️  Ashridge Dashboard — Ingest\n---");

  await ingestContentQueue();
  await ingestGeo();
  await ingestLocalSeo();
  await ingestIntel();

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
