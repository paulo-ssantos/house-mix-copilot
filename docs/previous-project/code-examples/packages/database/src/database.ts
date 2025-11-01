import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import { generateId } from "@church-copilot/shared";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseManager {
  private sqlite: Database.Database;
  private db: BetterSQLite3Database<typeof schema>;
  private initialized = false;

  constructor(dbPath?: string) {
    // Default database path
    const defaultPath = path.join(process.cwd(), "data", "church-copilot.db");
    const finalPath = dbPath || defaultPath;

    // Ensure directory exists
    const dbDir = path.dirname(finalPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.sqlite = new Database(finalPath);
    this.sqlite.pragma("journal_mode = WAL");
    this.sqlite.pragma("foreign_keys = ON");

    this.db = drizzle(this.sqlite, { schema });
  }

  /**
   * Initialize database with tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Run migrations if migration files exist
      const migrationsPath = path.join(__dirname, "migrations");
      if (fs.existsSync(migrationsPath)) {
        migrate(this.db, { migrationsFolder: migrationsPath });
      } else {
        // Create tables manually if no migrations
        await this.createTables();
      }

      this.initialized = true;
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  /**
   * Create tables manually (fallback if no migrations)
   */
  private async createTables(): Promise<void> {
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS liturgies (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date INTEGER NOT NULL,
        description TEXT,
        church TEXT,
        elders TEXT,
        conductors TEXT,
        raw_text TEXT,
        metadata TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS liturgy_items (
        id TEXT PRIMARY KEY,
        liturgy_id TEXT NOT NULL REFERENCES liturgies(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_time TEXT,
        duration INTEGER,
        responsible TEXT,
        youtube_url TEXT,
        music_key TEXT,
        notes TEXT,
        \`order\` INTEGER NOT NULL DEFAULT 0,
        is_completed INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS youtube_videos (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        video_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        duration INTEGER,
        thumbnail_url TEXT,
        channel_name TEXT,
        published_at INTEGER,
        file_path TEXT,
        file_size INTEGER,
        format TEXT,
        download_status TEXT NOT NULL DEFAULT 'PENDING',
        download_progress INTEGER NOT NULL DEFAULT 0,
        error TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS stream_content (
        id TEXT PRIMARY KEY,
        liturgy_id TEXT NOT NULL REFERENCES liturgies(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        tags TEXT,
        initial_message TEXT,
        thumbnail TEXT,
        is_live INTEGER NOT NULL DEFAULT 0,
        stream_url TEXT,
        chat_messages TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS configuration (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS file_operations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        source_path TEXT NOT NULL,
        target_path TEXT,
        progress INTEGER NOT NULL DEFAULT 0,
        completed INTEGER NOT NULL DEFAULT 0,
        error TEXT,
        metadata TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS inter_space_events (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        source TEXT NOT NULL,
        target TEXT,
        processed INTEGER NOT NULL DEFAULT 0,
        processed_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE INDEX IF NOT EXISTS idx_liturgy_items_liturgy_id ON liturgy_items(liturgy_id);
      CREATE INDEX IF NOT EXISTS idx_liturgy_items_order ON liturgy_items(\`order\`);
      CREATE INDEX IF NOT EXISTS idx_youtube_videos_video_id ON youtube_videos(video_id);
      CREATE INDEX IF NOT EXISTS idx_stream_content_liturgy_id ON stream_content(liturgy_id);
      CREATE INDEX IF NOT EXISTS idx_configuration_key ON configuration(key);
      CREATE INDEX IF NOT EXISTS idx_file_operations_type ON file_operations(type);
      CREATE INDEX IF NOT EXISTS idx_inter_space_events_type ON inter_space_events(type);
      CREATE INDEX IF NOT EXISTS idx_inter_space_events_processed ON inter_space_events(processed);
    `;

    this.sqlite.exec(createTablesSQL);
  }

  /**
   * Get the Drizzle database instance
   */
  getDb(): BetterSQLite3Database<typeof schema> {
    return this.db;
  }

  /**
   * Get the raw SQLite instance
   */
  getSqlite(): Database.Database {
    return this.sqlite;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.sqlite.close();
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (db: BetterSQLite3Database<typeof schema>) => Promise<T>
  ): Promise<T> {
    return this.db.transaction(callback);
  }

  /**
   * Backup database to a file
   */
  backup(backupPath: string): void {
    try {
      // Simple file copy approach for SQLite backup
      fs.copyFileSync(this.sqlite.name, backupPath);
    } catch (error) {
      console.error("Backup failed:", error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  getStats(): {
    liturgies: number;
    liturgyItems: number;
    youtubeVideos: number;
    streamContent: number;
    fileOperations: number;
    events: number;
  } {
    const liturgiesCount = this.sqlite
      .prepare("SELECT COUNT(*) as count FROM liturgies")
      .get() as { count: number };
    const itemsCount = this.sqlite
      .prepare("SELECT COUNT(*) as count FROM liturgy_items")
      .get() as { count: number };
    const videosCount = this.sqlite
      .prepare("SELECT COUNT(*) as count FROM youtube_videos")
      .get() as { count: number };
    const streamCount = this.sqlite
      .prepare("SELECT COUNT(*) as count FROM stream_content")
      .get() as { count: number };
    const opsCount = this.sqlite
      .prepare("SELECT COUNT(*) as count FROM file_operations")
      .get() as { count: number };
    const eventsCount = this.sqlite
      .prepare("SELECT COUNT(*) as count FROM inter_space_events")
      .get() as { count: number };

    return {
      liturgies: liturgiesCount.count,
      liturgyItems: itemsCount.count,
      youtubeVideos: videosCount.count,
      streamContent: streamCount.count,
      fileOperations: opsCount.count,
      events: eventsCount.count,
    };
  }
}

// Singleton instance
let dbInstance: DatabaseManager | null = null;

/**
 * Get or create database instance
 */
export function getDatabase(dbPath?: string): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager(dbPath);
  }
  return dbInstance;
}

/**
 * Initialize database
 */
export async function initializeDatabase(
  dbPath?: string
): Promise<DatabaseManager> {
  const db = getDatabase(dbPath);
  await db.initialize();
  return db;
}

// Export schema
export * from "./schema";
