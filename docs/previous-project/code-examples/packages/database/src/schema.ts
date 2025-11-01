import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
} from "drizzle-orm/sqlite-core";

// Base columns for all tables
const baseColumns = {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
};

// Liturgies table
export const liturgies = sqliteTable("liturgies", {
  ...baseColumns,
  title: text("title").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  description: text("description"),
  church: text("church"),
  elders: text("elders"), // JSON array of strings
  conductors: text("conductors"), // JSON array of strings
  rawText: text("raw_text"),
  metadata: text("metadata"), // JSON object
});

// Liturgy items table
export const liturgyItems = sqliteTable("liturgy_items", {
  ...baseColumns,
  liturgyId: text("liturgy_id")
    .notNull()
    .references(() => liturgies.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // LiturgyItemType enum
  title: text("title").notNull(),
  description: text("description"),
  startTime: text("start_time"), // HH:mm format
  duration: integer("duration"), // minutes
  responsible: text("responsible"),
  youtubeUrl: text("youtube_url"),
  musicKey: text("music_key"),
  notes: text("notes"),
  order: integer("order").notNull().default(0),
  isCompleted: integer("is_completed", { mode: "boolean" })
    .notNull()
    .default(false),
});

// YouTube videos table
export const youtubeVideos = sqliteTable("youtube_videos", {
  ...baseColumns,
  url: text("url").notNull(),
  videoId: text("video_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration"), // seconds
  thumbnailUrl: text("thumbnail_url"),
  channelName: text("channel_name"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  format: text("format"),
  downloadStatus: text("download_status").notNull().default("PENDING"),
  downloadProgress: integer("download_progress").notNull().default(0),
  error: text("error"),
});

// Stream content table
export const streamContent = sqliteTable("stream_content", {
  ...baseColumns,
  liturgyId: text("liturgy_id")
    .notNull()
    .references(() => liturgies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tags: text("tags"), // JSON array of strings
  initialMessage: text("initial_message"),
  thumbnail: text("thumbnail"),
  isLive: integer("is_live", { mode: "boolean" }).notNull().default(false),
  streamUrl: text("stream_url"),
  chatMessages: text("chat_messages"), // JSON array of chat messages
});

// Configuration table
export const configuration = sqliteTable("configuration", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(), // JSON serialized value
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// File operations table (for tracking downloads, uploads, etc.)
export const fileOperations = sqliteTable("file_operations", {
  ...baseColumns,
  type: text("type").notNull(), // 'UPLOAD' | 'DOWNLOAD' | 'DELETE' | 'MOVE' | 'COPY'
  sourcePath: text("source_path").notNull(),
  targetPath: text("target_path"),
  progress: integer("progress").notNull().default(0),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  error: text("error"),
  metadata: text("metadata"), // JSON object for additional data
});

// Inter-space events table (for communication between spaces)
export const interSpaceEvents = sqliteTable("inter_space_events", {
  ...baseColumns,
  type: text("type").notNull(),
  payload: text("payload").notNull(), // JSON serialized payload
  source: text("source").notNull(), // SpaceType
  target: text("target"), // SpaceType (optional for broadcast)
  processed: integer("processed", { mode: "boolean" }).notNull().default(false),
  processedAt: integer("processed_at", { mode: "timestamp" }),
});

// Export table types
export type Liturgy = typeof liturgies.$inferSelect;
export type NewLiturgy = typeof liturgies.$inferInsert;
export type LiturgyItem = typeof liturgyItems.$inferSelect;
export type NewLiturgyItem = typeof liturgyItems.$inferInsert;
export type YouTubeVideo = typeof youtubeVideos.$inferSelect;
export type NewYouTubeVideo = typeof youtubeVideos.$inferInsert;
export type StreamContent = typeof streamContent.$inferSelect;
export type NewStreamContent = typeof streamContent.$inferInsert;
export type Configuration = typeof configuration.$inferSelect;
export type NewConfiguration = typeof configuration.$inferInsert;
export type FileOperation = typeof fileOperations.$inferSelect;
export type NewFileOperation = typeof fileOperations.$inferInsert;
export type InterSpaceEvent = typeof interSpaceEvents.$inferSelect;
export type NewInterSpaceEvent = typeof interSpaceEvents.$inferInsert;
