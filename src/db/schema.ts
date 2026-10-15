import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const userMangas = sqliteTable("user_mangas", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  mangaId: text("manga_id").notNull(),
  title: text("title").notNull(),
  coverUrl: text("cover_url"),
  currentChapter: real("current_chapter").default(0).notNull(),
  totalChapters: integer("total_chapters"),
  status: text("status", { 
    enum: ["reading", "completed", "on_hold", "dropped", "plan_to_read"] 
  }).default("reading").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type UserManga = typeof userMangas.$inferSelect;
export type NewUserManga = typeof userMangas.$inferInsert;
