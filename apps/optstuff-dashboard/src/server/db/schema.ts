import { relations, sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `optstuff_${name}`);

// ============================================================================
// Teams (Organizations)
// ============================================================================

/**
 * Teams table - fully managed by the application.
 *
 * Access control is based on ownerId. Future: TeamMembership table for invites.
 *
 * Fields:
 * - ownerId: User who created and owns the team (used for access control)
 * - isPersonal: Whether this is the user's personal team
 */
export const teams = createTable(
  "team",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    ownerId: d.varchar({ length: 255 }).notNull(), // User ID who owns this team (used for access control)
    name: d.varchar({ length: 255 }).notNull(),
    slug: d.varchar({ length: 255 }).notNull().unique(),
    isPersonal: d.boolean().default(false).notNull(), // Is this user's personal team?
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("team_owner_idx").on(t.ownerId),
    // Ensure each user can only have one personal team
    uniqueIndex("team_owner_personal_unique")
      .on(t.ownerId)
      .where(sql`${t.isPersonal} = true`),
  ],
);

export const teamsRelations = relations(teams, ({ many }) => ({
  projects: many(projects),
}));

// ============================================================================
// Projects
// ============================================================================

export const projects = createTable(
  "project",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    teamId: d
      .uuid()
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 255 }).notNull(),
    slug: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    // Referer whitelist - controls which websites can use this project's service
    allowedRefererDomains: d.text().array(),
    // Cached statistics (updated on API key/usage changes)
    apiKeyCount: d.integer().default(0).notNull(),
    totalRequests: d.bigint({ mode: "number" }).default(0).notNull(),
    totalBandwidth: d.bigint({ mode: "number" }).default(0).notNull(),
    lastActivityAt: d.timestamp({ withTimezone: true }),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("project_team_idx").on(t.teamId),
    unique("project_team_slug_unique").on(t.teamId, t.slug),
  ],
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
  apiKeys: many(apiKeys),
  usageRecords: many(usageRecords),
  pinnedBy: many(pinnedProjects),
  requestLogs: many(requestLogs),
}));

// ============================================================================
// Pinned Projects
// ============================================================================

/**
 * Pinned Projects table - tracks which projects users have pinned.
 * Allows users to quickly access their favorite projects.
 */
export const pinnedProjects = createTable(
  "pinned_project",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    userId: d.varchar({ length: 255 }).notNull(), // Clerk user ID
    projectId: d
      .uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    pinnedAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => [
    unique("pinned_user_project_unique").on(t.userId, t.projectId),
    index("pinned_user_idx").on(t.userId),
  ],
);

export const pinnedProjectsRelations = relations(pinnedProjects, ({ one }) => ({
  project: one(projects, {
    fields: [pinnedProjects.projectId],
    references: [projects.id],
  }),
}));

// ============================================================================
// API Keys
// ============================================================================

export const apiKeys = createTable(
  "api_key",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    projectId: d
      .uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 255 }).notNull(),
    keyPrefix: d.varchar({ length: 12 }).notNull(), // Display prefix "pk_abc123..."
    keyFull: d.varchar({ length: 255 }).notNull().unique(), // Encrypted API key (AES-256-GCM format: iv:authTag:ciphertext)
    secretKey: d.varchar({ length: 255 }).notNull(), // Encrypted secret key (AES-256-GCM format: iv:authTag:ciphertext)
    // Domain whitelist - controls which image sources this key can access
    allowedSourceDomains: d.text().array(),
    createdBy: d.varchar({ length: 255 }).notNull(), // Clerk user ID who created this key
    expiresAt: d.timestamp({ withTimezone: true }),
    rateLimitPerMinute: d.integer().default(60),
    rateLimitPerDay: d.integer().default(10000),
    lastUsedAt: d.timestamp({ withTimezone: true }),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    revokedAt: d.timestamp({ withTimezone: true }),
  }),
  (t) => [
    index("api_key_project_idx").on(t.projectId),
    // Composite index for querying active keys by project
    index("api_key_project_active_idx").on(t.projectId, t.revokedAt),
    // Index for looking up keys by prefix (used in signature verification)
    index("api_key_prefix_idx").on(t.keyPrefix),
  ],
);

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  project: one(projects, {
    fields: [apiKeys.projectId],
    references: [projects.id],
  }),
  usageRecords: many(usageRecords),
}));

// ============================================================================
// Usage Records
// ============================================================================

export const usageRecords = createTable(
  "usage_record",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    projectId: d
      .uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    apiKeyId: d.uuid().references(() => apiKeys.id, { onDelete: "set null" }),
    date: d.date().notNull(),
    requestCount: d.integer().default(0).notNull(),
    bytesProcessed: d.bigint({ mode: "number" }).default(0).notNull(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => [
    // Composite index for range queries: WHERE projectId = ? AND date BETWEEN ? AND ?
    index("usage_project_date_idx").on(t.projectId, t.date),
    // Partial unique index for usage without API key (NULL apiKeyId)
    uniqueIndex("usage_project_date_null_apikey_unique")
      .on(t.projectId, t.date)
      .where(sql`${t.apiKeyId} IS NULL`),
    // Partial unique index for usage with specific API key
    uniqueIndex("usage_project_apikey_date_unique")
      .on(t.projectId, t.apiKeyId, t.date)
      .where(sql`${t.apiKeyId} IS NOT NULL`),
  ],
);

export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  project: one(projects, {
    fields: [usageRecords.projectId],
    references: [projects.id],
  }),
  apiKey: one(apiKeys, {
    fields: [usageRecords.apiKeyId],
    references: [apiKeys.id],
  }),
}));

// ============================================================================
// Request Logs (for IPX service monitoring)
// ============================================================================

/**
 * Request Logs table - stores individual IPX request logs.
 * Used for:
 * - Real-time request log display (last 20 requests)
 * - Top images statistics
 * - Bandwidth savings calculation
 */
export const requestLogs = createTable(
  "request_log",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    projectId: d
      .uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sourceUrl: d.text().notNull(),
    status: d.varchar({ length: 20 }).notNull(), // success, error, forbidden
    processingTimeMs: d.integer(),
    originalSize: d.bigint({ mode: "number" }),
    optimizedSize: d.bigint({ mode: "number" }),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => [
    index("request_log_project_idx").on(t.projectId),
    index("request_log_project_created_idx").on(t.projectId, t.createdAt),
    index("request_log_source_url_idx").on(t.sourceUrl),
    // Single-column index for cleanup queries that filter only on createdAt
    index("request_log_created_at_idx").on(t.createdAt),
  ],
);

export const requestLogsRelations = relations(requestLogs, ({ one }) => ({
  project: one(projects, {
    fields: [requestLogs.projectId],
    references: [projects.id],
  }),
}));
