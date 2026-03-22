import { pgTable, text, timestamp, integer, boolean, serial } from "drizzle-orm/pg-core";

export const contentQueue = pgTable("content_queue", {
  id: serial("id").primaryKey(),
  pageTitle: text("page_title"),
  targetKeyword: text("target_keyword"),
  priority: text("priority").default("MED"),
  status: text("status").default("Not started"),
  assignedTo: text("assigned_to"),
  due: text("due"),
  notes: text("notes"),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const geoScores = pgTable("geo_scores", {
  id: serial("id").primaryKey(),
  location: text("location").notNull(),
  score: integer("score"),
  baseline: integer("baseline"),
  trackedAt: timestamp("tracked_at").defaultNow(),
});

export const agentActivity = pgTable("agent_activity", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  agentName: text("agent_name").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  ranAt: timestamp("ran_at").defaultNow(),
});

export const localSeoTracker = pgTable("local_seo_tracker", {
  id: serial("id").primaryKey(),
  location: text("location").notNull(),
  gbpPost: boolean("gbp_post").default(false),
  reviewCount: integer("review_count").default(0),
  trackedAt: timestamp("tracked_at").defaultNow(),
});

export const intelItems = pgTable("intel_items", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(),
  topic: text("topic").notNull(),
  summary: text("summary"),
  source: text("source"),
  priority: text("priority").default("MED"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});
