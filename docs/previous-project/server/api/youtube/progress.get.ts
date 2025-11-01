import {
  initializeDatabase,
  YouTubeVideoRepository,
} from "@church-copilot/database";
import { DownloadQueue } from "@church-copilot/youtube-service";
import { YouTubeAutoDownloadService } from "@church-copilot/ai-service";
import { type YouTubeConfig } from "@church-copilot/shared";
import { defineEventHandler, getQuery, createError } from "h3";

// Global download queue instance (shared with download endpoints)
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
    // Initialize database
    const db = await initializeDatabase();
    const dbInstance = db.getDb();
    const videoRepo = new YouTubeVideoRepository(dbInstance);

    const query = getQuery(event);
    const videoId = query.videoId as string;

    if (videoId) {
      // Get progress for specific video
      const video = await videoRepo.findByVideoId(videoId);
      if (!video) {
        throw createError({
          statusCode: 404,
          statusMessage: "Video not found",
        });
      }

      return {
        success: true,
        progress: {
          videoId: video.videoId,
          title: video.title,
          status: video.downloadStatus,
          progress: video.downloadProgress || 0,
          filePath: video.filePath,
          url: video.url,
        },
      };
    } else {
      // Get progress for all active downloads from both database and queue
      const dbActiveDownloads = await videoRepo.findByStatus("DOWNLOADING");
      const dbPendingDownloads = await videoRepo.findByStatus("PENDING");
      const dbRecentCompleted = await videoRepo.findByStatus("COMPLETED");

      // Get queue-based downloads
      const queue = await getDownloadQueue();
      const queueJobs = queue.getJobs();

      // Convert queue jobs to our format
      const queueActiveDownloads = queueJobs
        .filter((job) => job.status === "downloading")
        .map((job) => ({
          videoId: job.videoId || job.id,
          title: job.title || "Loading...",
          status: "DOWNLOADING" as const,
          progress: job.progress || 0,
          url: job.url,
        }));

      const queuePendingDownloads = queueJobs
        .filter((job) => job.status === "pending")
        .map((job) => ({
          videoId: job.videoId || job.id,
          title: job.title || "Waiting...",
          status: "PENDING" as const,
          progress: 0,
          url: job.url,
        }));

      const queueCompletedDownloads = queueJobs
        .filter((job) => job.status === "completed")
        .map((job) => ({
          videoId: job.videoId || job.id,
          title: job.title || "Unknown",
          status: "COMPLETED" as const,
          progress: 100,
          filePath: job.filePath,
          url: job.url,
        }));

      // Combine database and queue results (removing duplicates by videoId)
      const combineAndDedupe = (dbItems: any[], queueItems: any[]) => {
        const combined = [...dbItems];
        const existingVideoIds = new Set(dbItems.map((item) => item.videoId));

        for (const queueItem of queueItems) {
          if (!existingVideoIds.has(queueItem.videoId)) {
            combined.push(queueItem);
          }
        }
        return combined;
      };

      const allActiveDownloads = combineAndDedupe(
        dbActiveDownloads.map((video) => ({
          videoId: video.videoId,
          title: video.title,
          status: video.downloadStatus,
          progress: video.downloadProgress || 0,
          url: video.url,
        })),
        queueActiveDownloads
      );

      const allPendingDownloads = combineAndDedupe(
        dbPendingDownloads.map((video) => ({
          videoId: video.videoId,
          title: video.title,
          status: video.downloadStatus,
          progress: 0,
          url: video.url,
        })),
        queuePendingDownloads
      );

      const allCompletedDownloads = combineAndDedupe(
        dbRecentCompleted.map((video) => ({
          videoId: video.videoId,
          title: video.title,
          status: video.downloadStatus,
          progress: 100,
          filePath: video.filePath,
          url: video.url,
        })),
        queueCompletedDownloads
      );

      return {
        success: true,
        downloads: {
          active: allActiveDownloads,
          pending: allPendingDownloads,
          completed: allCompletedDownloads,
        },
      };
    }
  } catch (error) {
    console.error("YouTube progress API error:", error);

    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error
          ? error.message
          : "Failed to get download progress",
    });
  }
});
