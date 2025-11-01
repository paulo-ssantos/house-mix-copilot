import { DownloadQueue } from "@church-copilot/youtube-service";
import { YouTubeAutoDownloadService } from "@church-copilot/ai-service";
import { initializeDatabase } from "@church-copilot/database";
import { type YouTubeConfig } from "@church-copilot/shared";
import { defineEventHandler, getQuery, createError } from "h3";

// Global download queue instance (shared with other endpoints)
let downloadQueue: DownloadQueue | null = null;

// Get YouTube configuration from database
async function getYouTubeConfig(): Promise<YouTubeConfig> {
  try {
    const db = await initializeDatabase();
    const dbInstance = db.getDb();
    const autoDownloadService = new YouTubeAutoDownloadService(dbInstance);
    const config = await autoDownloadService.getConfig();

    return {
      downloadPath:
        config.downloadFolder ||
        process.env.YOUTUBE_DOWNLOAD_PATH ||
        "./downloads/youtube",
      preferredFormat:
        process.env.YOUTUBE_PREFERRED_FORMAT || "best[height<=720]",
      audioOnly: process.env.YOUTUBE_AUDIO_ONLY === "true",
      subtitles: process.env.YOUTUBE_SUBTITLES === "true",
      maxConcurrentDownloads:
        config.maxConcurrentDownloads ||
        parseInt(process.env.YOUTUBE_MAX_CONCURRENT || "2"),
    };
  } catch (error) {
    console.warn("Failed to get config from database, using defaults:", error);
    // Fallback to environment variables/defaults
    return {
      downloadPath: process.env.YOUTUBE_DOWNLOAD_PATH || "./downloads/youtube",
      preferredFormat:
        process.env.YOUTUBE_PREFERRED_FORMAT || "best[height<=720]",
      audioOnly: process.env.YOUTUBE_AUDIO_ONLY === "true",
      subtitles: process.env.YOUTUBE_SUBTITLES === "true",
      maxConcurrentDownloads: parseInt(
        process.env.YOUTUBE_MAX_CONCURRENT || "2"
      ),
    };
  }
}

async function getDownloadQueue(): Promise<DownloadQueue> {
  const youtubeConfig = await getYouTubeConfig();

  if (!downloadQueue) {
    downloadQueue = new DownloadQueue(youtubeConfig);
  } else {
    // Update existing queue configuration
    downloadQueue.updateConfig(youtubeConfig);
  }

  return downloadQueue;
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { jobId } = query;

    if (!jobId || typeof jobId !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "Job ID is required",
      });
    }

    const queue = await getDownloadQueue();
    const success = queue.removeFromQueue(jobId);

    if (!success) {
      throw createError({
        statusCode: 404,
        statusMessage: "Job not found or already completed",
      });
    }

    return {
      success: true,
      message: "Download cancelled successfully",
    };
  } catch (error: any) {
    console.error("YouTube cancel API error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to cancel download",
    });
  }
});
