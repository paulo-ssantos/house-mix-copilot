import { eq, desc, asc, and, like, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import {
  liturgies,
  liturgyItems,
  youtubeVideos,
  streamContent,
  configuration,
  type Liturgy,
  type NewLiturgy,
  type LiturgyItem,
  type NewLiturgyItem,
  type YouTubeVideo,
  type NewYouTubeVideo,
  type StreamContent,
  type NewStreamContent,
  type Configuration,
  type NewConfiguration,
} from "./schema";
import { generateId } from "@church-copilot/shared";
import * as schema from "./schema";

export class LiturgyRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  async create(
    data: Omit<NewLiturgy, "id" | "createdAt" | "updatedAt">
  ): Promise<Liturgy> {
    const id = generateId();
    const now = new Date();

    const liturgy: NewLiturgy = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(liturgies).values(liturgy);
    return this.findById(id) as Promise<Liturgy>;
  }

  async findById(id: string): Promise<Liturgy | null> {
    const result = await this.db
      .select()
      .from(liturgies)
      .where(eq(liturgies.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: "date" | "title" | "createdAt";
    order?: "asc" | "desc";
    search?: string;
  }): Promise<Liturgy[]> {
    // Build query step by step
    const baseQuery = this.db.select().from(liturgies);

    // Apply filters and ordering
    let finalQuery = baseQuery;

    // Search filter
    if (options?.search) {
      finalQuery = finalQuery.where(
        like(liturgies.title, `%${options.search}%`)
      ) as any;
    }

    // Ordering
    const orderField = options?.orderBy || "date";
    const orderDirection = options?.order || "desc";

    if (orderField === "date") {
      finalQuery =
        orderDirection === "asc"
          ? (finalQuery.orderBy(asc(liturgies.date)) as any)
          : (finalQuery.orderBy(desc(liturgies.date)) as any);
    } else if (orderField === "title") {
      finalQuery =
        orderDirection === "asc"
          ? (finalQuery.orderBy(asc(liturgies.title)) as any)
          : (finalQuery.orderBy(desc(liturgies.title)) as any);
    } else {
      finalQuery =
        orderDirection === "asc"
          ? (finalQuery.orderBy(asc(liturgies.createdAt)) as any)
          : (finalQuery.orderBy(desc(liturgies.createdAt)) as any);
    }

    // Pagination
    if (options?.limit) {
      finalQuery = finalQuery.limit(options.limit) as any;
    }
    if (options?.offset) {
      finalQuery = finalQuery.offset(options.offset) as any;
    }

    return finalQuery;
  }

  async update(
    id: string,
    data: Partial<Omit<NewLiturgy, "id" | "createdAt">>
  ): Promise<Liturgy | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await this.db.update(liturgies).set(updateData).where(eq(liturgies.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(liturgies).where(eq(liturgies.id, id));
    return result.changes > 0;
  }

  async getWithItems(
    id: string
  ): Promise<(Liturgy & { items: LiturgyItem[] }) | null> {
    const liturgy = await this.findById(id);
    if (!liturgy) return null;

    const items = await this.db
      .select()
      .from(liturgyItems)
      .where(eq(liturgyItems.liturgyId, id))
      .orderBy(asc(liturgyItems.order));

    return { ...liturgy, items };
  }

  async count(search?: string): Promise<number> {
    let countQuery = this.db
      .select({ count: sql`count(*)`.as("count") })
      .from(liturgies);

    if (search) {
      countQuery = countQuery.where(
        like(liturgies.title, `%${search}%`)
      ) as any;
    }

    const result = await countQuery;
    return (result[0]?.count as number) || 0;
  }
}

export class LiturgyItemRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  async create(
    data: Omit<NewLiturgyItem, "id" | "createdAt" | "updatedAt">
  ): Promise<LiturgyItem> {
    const id = generateId();
    const now = new Date();

    const item: NewLiturgyItem = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(liturgyItems).values(item);
    return this.findById(id) as Promise<LiturgyItem>;
  }

  async findById(id: string): Promise<LiturgyItem | null> {
    const result = await this.db
      .select()
      .from(liturgyItems)
      .where(eq(liturgyItems.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findByLiturgyId(liturgyId: string): Promise<LiturgyItem[]> {
    return this.db
      .select()
      .from(liturgyItems)
      .where(eq(liturgyItems.liturgyId, liturgyId))
      .orderBy(asc(liturgyItems.order));
  }

  async update(
    id: string,
    data: Partial<Omit<NewLiturgyItem, "id" | "createdAt">>
  ): Promise<LiturgyItem | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await this.db
      .update(liturgyItems)
      .set(updateData)
      .where(eq(liturgyItems.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(liturgyItems)
      .where(eq(liturgyItems.id, id));
    return result.changes > 0;
  }

  async reorder(liturgyId: string, itemIds: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (let i = 0; i < itemIds.length; i++) {
        await tx
          .update(liturgyItems)
          .set({ order: i, updatedAt: new Date() })
          .where(
            and(
              eq(liturgyItems.id, itemIds[i]),
              eq(liturgyItems.liturgyId, liturgyId)
            )
          );
      }
    });
  }

  async markCompleted(
    id: string,
    completed: boolean = true
  ): Promise<LiturgyItem | null> {
    return this.update(id, { isCompleted: completed });
  }
}

export class YouTubeVideoRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  async create(
    data: Omit<NewYouTubeVideo, "id" | "createdAt" | "updatedAt">
  ): Promise<YouTubeVideo> {
    const id = generateId();
    const now = new Date();

    const video: NewYouTubeVideo = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(youtubeVideos).values(video);
    return this.findById(id) as Promise<YouTubeVideo>;
  }

  async findById(id: string): Promise<YouTubeVideo | null> {
    const result = await this.db
      .select()
      .from(youtubeVideos)
      .where(eq(youtubeVideos.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findByVideoId(videoId: string): Promise<YouTubeVideo | null> {
    const result = await this.db
      .select()
      .from(youtubeVideos)
      .where(eq(youtubeVideos.videoId, videoId))
      .limit(1);
    return result[0] || null;
  }

  async findByStatus(
    status: "PENDING" | "DOWNLOADING" | "COMPLETED" | "FAILED"
  ): Promise<YouTubeVideo[]> {
    return this.db
      .select()
      .from(youtubeVideos)
      .where(eq(youtubeVideos.downloadStatus, status));
  }

  async update(
    id: string,
    data: Partial<Omit<NewYouTubeVideo, "id" | "createdAt">>
  ): Promise<YouTubeVideo | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await this.db
      .update(youtubeVideos)
      .set(updateData)
      .where(eq(youtubeVideos.id, id));
    return this.findById(id);
  }

  async updateProgress(
    id: string,
    progress: number,
    status?: string
  ): Promise<YouTubeVideo | null> {
    const updateData: any = {
      downloadProgress: progress,
      updatedAt: new Date(),
    };

    if (status) {
      updateData.downloadStatus = status;
    }

    await this.db
      .update(youtubeVideos)
      .set(updateData)
      .where(eq(youtubeVideos.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(youtubeVideos)
      .where(eq(youtubeVideos.id, id));
    return result.changes > 0;
  }
}

export class StreamContentRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  async create(
    data: Omit<NewStreamContent, "id" | "createdAt" | "updatedAt">
  ): Promise<StreamContent> {
    const id = generateId();
    const now = new Date();

    const content: NewStreamContent = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(streamContent).values(content);
    return this.findById(id) as Promise<StreamContent>;
  }

  async findById(id: string): Promise<StreamContent | null> {
    const result = await this.db
      .select()
      .from(streamContent)
      .where(eq(streamContent.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findByLiturgyId(liturgyId: string): Promise<StreamContent | null> {
    const result = await this.db
      .select()
      .from(streamContent)
      .where(eq(streamContent.liturgyId, liturgyId))
      .limit(1);
    return result[0] || null;
  }

  async update(
    id: string,
    data: Partial<Omit<NewStreamContent, "id" | "createdAt">>
  ): Promise<StreamContent | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await this.db
      .update(streamContent)
      .set(updateData)
      .where(eq(streamContent.id, id));
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(streamContent)
      .where(eq(streamContent.id, id));
    return result.changes > 0;
  }

  async setLive(
    id: string,
    isLive: boolean,
    streamUrl?: string
  ): Promise<StreamContent | null> {
    const updateData: any = {
      isLive,
      updatedAt: new Date(),
    };

    if (streamUrl !== undefined) {
      updateData.streamUrl = streamUrl;
    }

    await this.db
      .update(streamContent)
      .set(updateData)
      .where(eq(streamContent.id, id));
    return this.findById(id);
  }
}

export class ConfigurationRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  async get(key: string): Promise<Configuration | null> {
    const result = await this.db
      .select()
      .from(configuration)
      .where(eq(configuration.key, key))
      .limit(1);
    return result[0] || null;
  }

  async set(key: string, value: any): Promise<Configuration> {
    const serializedValue = JSON.stringify(value);
    const now = new Date();

    // Try to update first
    const existing = await this.get(key);
    if (existing) {
      await this.db
        .update(configuration)
        .set({ value: serializedValue, updatedAt: now })
        .where(eq(configuration.key, key));
      return this.get(key) as Promise<Configuration>;
    }

    // Insert new configuration
    const configId = generateId();
    const newConfig: NewConfiguration = {
      id: configId,
      key,
      value: serializedValue,
      updatedAt: now,
    };

    await this.db.insert(configuration).values(newConfig);
    return this.get(key) as Promise<Configuration>;
  }

  async getValue(key: string, defaultValue: any = null): Promise<any> {
    const config = await this.get(key);
    if (!config) {
      return defaultValue;
    }
    try {
      return JSON.parse(config.value);
    } catch {
      return defaultValue;
    }
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.db
      .delete(configuration)
      .where(eq(configuration.key, key));
    return result.changes > 0;
  }

  async getAll(): Promise<Configuration[]> {
    return this.db.select().from(configuration);
  }

  async getAllAsObject(): Promise<Record<string, any>> {
    const configs = await this.getAll();
    const result: Record<string, any> = {};
    for (const config of configs) {
      try {
        result[config.key] = JSON.parse(config.value);
      } catch {
        result[config.key] = config.value;
      }
    }
    return result;
  }
}
