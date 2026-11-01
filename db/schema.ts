import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const workspaces = sqliteTable("ambi_workspaces", {
  owner: text("owner").primaryKey(),
  state: text("state").notNull(),
  version: integer("version").notNull().default(0),
});
export const usage = sqliteTable("ambi_usage", {
  day: text("day").primaryKey(),
  count: integer("count").notNull().default(0),
});
