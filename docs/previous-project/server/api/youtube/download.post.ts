import { DownloadQueue } from "@church-copilot/youtube-service";
import { YouTubeAutoDownloadService } from "@church-copilot/ai-service";
import { initializeDatabase } from "@church-copilot/database";
import { type YouTubeConfig } from "@church-copilot/shared";
import { defineEventHandler, readBody, createError } from "h3";

// Global download queue instance
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
        config.downloadFolder || // FIX: Map downloadFolder to downloadPath
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
    const body = await readBody(event);
    const { url, priority = 3, format, audioOnly, filename } = body;

    if (!url || typeof url !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "URL is required and must be a string",
      });
    }

    const queue = await getDownloadQueue();

    // Add to download queue
    const job = await queue.addToQueue(url, {
      priority,
      format,
      audioOnly,
      filename,
    });

    return {
      success: true,
      data: {
        jobId: job.id,
        videoId: job.videoId,
        title: job.title,
        status: job.status,
        priority: job.priority,
        addedAt: job.addedAt,
      },
    };
  } catch (error: any) {
    console.error("YouTube download API error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to start download",
    });
  }
});
