import { z } from "zod";

// Base entity schema
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Liturgy item types
export const LiturgyItemTypeSchema = z.enum([
  "OPENING", // Abertura
  "PRAYER", // Oração
  "MUSIC", // Música
  "SPECIAL_MUSIC", // Música especial
  "READING", // Leitura
  "MESSAGE", // Mensagem/Sermão
  "OFFERING", // Ofertas/Dízimos
  "ANNOUNCEMENT", // Informativos
  "MOMENT", // Momentos especiais
  "CLOSING", // Encerramento
  "BREAK", // Intervalo
  "OTHER", // Outros
]);

// Space types
export const SpaceTypeSchema = z.enum([
  "MAIN", // Main space - sound and project management
  "STREAM", // Stream space - YouTube streaming
  "UNIFIED", // Unified mode - both spaces combined
]);

// App mode enum (same as SpaceType for consistency)
export const AppModeSchema = z.enum([
  "main-space",
  "stream-space",
  "unified-mode",
]);

export type AppMode = z.infer<typeof AppModeSchema>;

// Liturgy item schema
export const LiturgyItemSchema = BaseEntitySchema.extend({
  type: LiturgyItemTypeSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().optional(), // Format: "HH:mm" or "HH:mm:ss"
  duration: z.number().optional(), // Duration in minutes
  responsible: z.string().optional(), // Person responsible
  youtubeUrl: z.string().url().optional(),
  musicKey: z.string().optional(),
  notes: z.string().optional(),
  order: z.number().int().min(0),
  isCompleted: z.boolean().default(false),
});

// Liturgy schema
export const LiturgySchema = BaseEntitySchema.extend({
  title: z.string().min(1),
  date: z.date(),
  description: z.string().optional(),
  church: z.string().optional(),
  elders: z.array(z.string()).default([]), // Anciãos
  conductors: z.array(z.string()).default([]), // Regentes
  items: z.array(LiturgyItemSchema).default([]),
  rawText: z.string().optional(), // Original input text
  metadata: z.record(z.string(), z.any()).default({}),
});

// YouTube video schema
export const YouTubeVideoSchema = BaseEntitySchema.extend({
  url: z.string().url(),
  videoId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  duration: z.number().optional(),
  thumbnailUrl: z.string().url().optional(),
  channelName: z.string().optional(),
  publishedAt: z.date().optional(),
  filePath: z.string().optional(), // Local file path after download
  fileSize: z.number().optional(),
  format: z.string().optional(),
  downloadStatus: z
    .enum(["PENDING", "DOWNLOADING", "COMPLETED", "FAILED"])
    .default("PENDING"),
  downloadProgress: z.number().min(0).max(100).default(0),
  error: z.string().optional(),
});

// Stream content schema
export const StreamContentSchema = BaseEntitySchema.extend({
  liturgyId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string()).max(10).default([]),
  initialMessage: z.string().optional(),
  thumbnail: z.string().optional(), // Path to custom thumbnail
  isLive: z.boolean().default(false),
  streamUrl: z.string().url().optional(),
  chatMessages: z
    .array(
      z.object({
        timestamp: z.date(),
        author: z.string(),
        message: z.string(),
      })
    )
    .default([]),
});

// State types for communication between apps
export interface LiturgyState {
  liturgy: Liturgy;
  currentItemIndex: number;
  isPlaying: boolean;
  startTime?: Date;
  pausedAt?: Date;
  totalElapsedTime: number; // in milliseconds
  metadata: Record<string, any>;
}

export interface StreamContentState {
  content: StreamContent;
  isLive: boolean;
  viewerCount?: number;
  chatEnabled: boolean;
  currentScene?: string;
  metadata: Record<string, any>;
}

// Configuration schemas
export const AIConfigSchema = z.object({
  ollamaUrl: z.string().url().default("http://localhost:11434"),
  model: z.string().default("llama3.2"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).default(2048),
  systemPrompt: z.string().optional(),
});

export const YouTubeConfigSchema = z.object({
  downloadPath: z.string().default("./downloads"),
  preferredFormat: z.string().default("best[height<=720]"),
  audioOnly: z.boolean().default(false),
  subtitles: z.boolean().default(true),
  maxConcurrentDownloads: z.number().min(1).max(5).default(2),
});

export const CommunicationConfigSchema = z.object({
  serverPort: z.number().min(1000).max(65535).default(3001),
  clientPort: z.number().min(1000).max(65535).default(3002),
  networkInterface: z.string().default("localhost"),
  enableNetworkDiscovery: z.boolean().default(true),
  heartbeatInterval: z.number().min(1000).default(5000), // milliseconds
});

export const AppConfigSchema = z.object({
  language: z.enum(["pt-BR", "en-US"]).default("pt-BR"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  autoSave: z.boolean().default(true),
  autoSaveInterval: z.number().min(30).default(300), // seconds
  ai: AIConfigSchema.default({}),
  youtube: YouTubeConfigSchema.default({}),
  communication: CommunicationConfigSchema.default({}),
});

// Export types
export type BaseEntity = z.infer<typeof BaseEntitySchema>;
export type LiturgyItemType = z.infer<typeof LiturgyItemTypeSchema>;
export type SpaceType = z.infer<typeof SpaceTypeSchema>;
export type LiturgyItem = z.infer<typeof LiturgyItemSchema>;
export type Liturgy = z.infer<typeof LiturgySchema>;
export type YouTubeVideo = z.infer<typeof YouTubeVideoSchema>;
export type StreamContent = z.infer<typeof StreamContentSchema>;
export type AIConfig = z.infer<typeof AIConfigSchema>;
export type YouTubeConfig = z.infer<typeof YouTubeConfigSchema>;
export type CommunicationConfig = z.infer<typeof CommunicationConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Event types for inter-space communication
export interface InterSpaceEvent {
  type: string;
  payload: any;
  timestamp: Date;
  source: SpaceType;
  target?: SpaceType;
}

// File operation types
export interface FileOperation {
  type: "UPLOAD" | "DOWNLOAD" | "DELETE" | "MOVE" | "COPY";
  sourcePath: string;
  targetPath?: string;
  progress?: number;
  completed?: boolean;
  error?: string;
}
