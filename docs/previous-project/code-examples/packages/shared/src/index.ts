// Export all types and utilities
export * from "./types";
export * from "./date-utils";
export * from "./utils";

// Export constants
export const APP_NAME = "Church Liturgy Copilot";
export const APP_VERSION = "1.0.0";

// Default configurations
export const DEFAULT_PORTS = {
  MAIN_SPACE: 3000,
  STREAM_SPACE: 3001,
  UNIFIED_MODE: 3002,
  COMMUNICATION: 3003,
} as const;

// Liturgy item type translations (PT-BR)
export const LITURGY_ITEM_TYPE_LABELS = {
  OPENING: "Abertura",
  PRAYER: "Oração",
  MUSIC: "Música",
  SPECIAL_MUSIC: "Música Especial",
  READING: "Leitura",
  MESSAGE: "Mensagem",
  OFFERING: "Ofertas/Dízimos",
  ANNOUNCEMENT: "Informativos",
  MOMENT: "Momento Especial",
  CLOSING: "Encerramento",
  BREAK: "Intervalo",
  OTHER: "Outros",
} as const;

// Common YouTube video qualities
export const YOUTUBE_FORMATS = {
  "best[height<=720]": "720p ou menor (recomendado)",
  "best[height<=1080]": "1080p ou menor",
  "best[height<=480]": "480p ou menor",
  worst: "Menor qualidade (economizar espaço)",
  bestaudio: "Apenas áudio",
} as const;

// Supported audio/video file extensions
export const SUPPORTED_MEDIA_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".mkv",
  ".avi",
  ".mov",
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".ogg",
] as const;
