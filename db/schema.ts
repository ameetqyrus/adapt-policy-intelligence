import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const testingUsage=sqliteTable('testing_usage',{id:text('id').primaryKey(),used:integer('used').notNull().default(0)});
export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url"),
  kind: text("kind").notNull(),
  scope: text("scope").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  fileKey: text("file_key"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});
export const chunks = sqliteTable(
  "chunks",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    body: text("body").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [index("idx_chunks_source").on(t.sourceId)],
);
export const investigations = sqliteTable(
  "investigations",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    counties: text("counties").notNull(),
    updatedAt: text("updated_at").notNull(),
    busyUntil: integer("busy_until").notNull().default(0),
  },
  (t) => [index("idx_investigations_owner").on(t.ownerId, t.updatedAt)],
);
export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    investigationId: text("investigation_id")
      .notNull()
      .references(() => investigations.id),
    role: text("role").notNull(),
    content: text("content").notNull(),
    citations: text("citations").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("idx_messages_investigation").on(t.investigationId, t.createdAt),
  ],
);
