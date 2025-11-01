import { YouTubeDownloader } from "@church-copilot/youtube-service";
import {
  ConfigurationRepository,
  YouTubeVideoRepository,
} from "@church-copilot/database";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@church-copilot/database/src/schema";
import {
  generateId,
  isValidYouTubeUrl,
  extractYouTubeVideoId,
  YouTubeConfig,
} from "@church-copilot/shared";
import path from "path";
import { promises as fs } from "fs";

export interface YouTubeAutoDownloadConfig {
  enabled: boolean;
  downloadFolder: string;
  quality: "highest" | "720p" | "480p" | "audio";
  filenameTemplate: string; // e.g., "{title} ({date})"
  maxConcurrentDownloads: number;
  skipExisting: boolean;
}

export interface DownloadResult {
  url: string;
  success: boolean;
  videoId?: string;
  title?: string;
  filePath?: string;
  error?: string;
}

export class YouTubeAutoDownloadService {
  private downloader: YouTubeDownloader;
  private configRepo: ConfigurationRepository;
  private videoRepo: YouTubeVideoRepository;

  constructor(private db: BetterSQLite3Database<typeof schema>) {
    this.configRepo = new ConfigurationRepository(db);
    this.videoRepo = new YouTubeVideoRepository(db);
    // Initialize with empty path - will be set dynamically in methods
    this.downloader = new YouTubeDownloader({
      downloadPath: path.join(process.cwd(), "downloads", "youtube"), // Default fallback
      preferredFormat: "best[height<=720]",
      audioOnly: false,
      subtitles: true,
      maxConcurrentDownloads: 2,
    });
  }

  async getConfig(): Promise<YouTubeAutoDownloadConfig> {
    const defaultConfig: YouTubeAutoDownloadConfig = {
      enabled: true,
      downloadFolder: path.join(process.cwd(), "downloads", "youtube"),
      quality: "highest",
      filenameTemplate: "{title} ({date})",
      maxConcurrentDownloads: 2,
      skipExisting: true,
    };

    return await this.configRepo.getValue(
      "youtube_auto_download",
      defaultConfig
    );
  }

  async setConfig(config: Partial<YouTubeAutoDownloadConfig>): Promise<void> {
    const currentConfig = await this.getConfig();
    const newConfig = { ...currentConfig, ...config };
    await this.configRepo.set("youtube_auto_download", newConfig);

    // Update downloader config if downloadFolder changed
    if (config.downloadFolder) {
      this.downloader = new YouTubeDownloader({
        downloadPath: newConfig.downloadFolder,
        preferredFormat: this.getPreferredFormat(newConfig.quality),
        audioOnly: newConfig.quality === "audio",
        subtitles: true,
        maxConcurrentDownloads: newConfig.maxConcurrentDownloads,
      });
    }
  }

  private async updateDownloaderConfig(
    config: YouTubeAutoDownloadConfig
  ): Promise<void> {
    this.downloader = new YouTubeDownloader({
      downloadPath: config.downloadFolder,
      preferredFormat: this.getPreferredFormat(config.quality),
      audioOnly: config.quality === "audio",
      subtitles: true,
      maxConcurrentDownloads: config.maxConcurrentDownloads,
    });
  }

  private getPreferredFormat(quality: string): string {
    switch (quality) {
      case "720p":
        return "best[height<=720]";
      case "480p":
        return "best[height<=480]";
      case "audio":
        return "bestaudio";
      default:
        return "best";
    }
  }

  async downloadYouTubeLinks(
    urls: string[],
    liturgyDate?: string
  ): Promise<DownloadResult[]> {
    const config = await this.getConfig();

    if (!config.enabled) {
      return urls.map((url) => ({
        url,
        success: false,
        error: "Auto-download is disabled",
      }));
    }

    // Update downloader configuration
    await this.updateDownloaderConfig(config);

    // Ensure download folder exists
    await fs.mkdir(config.downloadFolder, { recursive: true });

    // Filter valid YouTube URLs
    const validUrls = urls.filter((url) => isValidYouTubeUrl(url));

    if (validUrls.length === 0) {
      return urls.map((url) => ({
        url,
        success: false,
        error: "Invalid YouTube URL",
      }));
    }

    const results: DownloadResult[] = [];
    const semaphore = new Array(config.maxConcurrentDownloads).fill(null);

    // Process downloads with concurrency limit
    const downloadPromises = validUrls.map(async (url, index) => {
      // Wait for available slot
      const slotIndex = index % config.maxConcurrentDownloads;
      await semaphore[slotIndex];

      semaphore[slotIndex] = this.downloadSingleVideo(url, config, liturgyDate);
      const result = await semaphore[slotIndex];
      results.push(result);

      return result;
    });

    await Promise.all(downloadPromises);

    return results;
  }

  private async downloadSingleVideo(
    url: string,
    config: YouTubeAutoDownloadConfig,
    liturgyDate?: string
  ): Promise<DownloadResult> {
    try {
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) {
        return {
          url,
          success: false,
          error: "Could not extract video ID from URL",
        };
      }

      // Check if already exists in database
      const existingVideo = await this.videoRepo.findByVideoId(videoId);
      if (
        existingVideo &&
        config.skipExisting &&
        existingVideo.downloadStatus === "COMPLETED"
      ) {
        return {
          url,
          success: true,
          videoId,
          title: existingVideo.title,
          filePath: existingVideo.filePath || undefined,
          error: "Already downloaded (skipped)",
        };
      }

      // Get video info
      const videoInfo = await this.downloader.getVideoInfo(url);
      if (!videoInfo) {
        return {
          url,
          success: false,
          videoId,
          error: "Could not fetch video information",
        };
      }

      // Generate filename using template
      const filename = this.generateFilename(config.filenameTemplate, {
        title: videoInfo.title,
        date: liturgyDate || new Date().toISOString().split("T")[0],
        videoId,
      });

      const filePath = path.join(config.downloadFolder, `${filename}.mp4`);

      // Create or update database record
      let dbVideo = existingVideo;
      if (!dbVideo) {
        dbVideo = await this.videoRepo.create({
          videoId,
          title: videoInfo.title,
          description: videoInfo.description,
          url,
          thumbnailUrl: videoInfo.thumbnailUrl,
          duration: videoInfo.duration,
          filePath,
          downloadStatus: "PENDING",
          downloadProgress: 0,
        });
      } else {
        dbVideo = await this.videoRepo.update(dbVideo.id, {
          downloadStatus: "DOWNLOADING",
          downloadProgress: 0,
          filePath,
        });
      }

      if (!dbVideo) {
        return {
          url,
          success: false,
          videoId,
          error: "Failed to create database record",
        };
      }

      // Set up progress tracking
      const progressHandler = async (progress: any) => {
        await this.videoRepo.updateProgress(
          dbVideo!.id,
          progress.percentage,
          "DOWNLOADING"
        );
      };

      this.downloader.on("progress", progressHandler);

      try {
        // Download the video
        const filePath = await this.downloader.downloadVideo(url, {
          outputPath: config.downloadFolder,
          filename,
          audioOnly: config.quality === "audio",
          format:
            config.quality === "highest"
              ? "best"
              : config.quality === "audio"
              ? "bestaudio"
              : `best[height<=${config.quality}]`,
        });

        if (filePath) {
          await this.videoRepo.update(dbVideo.id, {
            downloadStatus: "COMPLETED",
            downloadProgress: 100,
            filePath,
          });

          return {
            url,
            success: true,
            videoId,
            title: videoInfo.title,
            filePath,
          };
        } else {
          await this.videoRepo.update(dbVideo.id, {
            downloadStatus: "FAILED",
            downloadProgress: 0,
          });

          return {
            url,
            success: false,
            videoId,
            title: videoInfo.title,
            error: "Download returned no file path",
          };
        }
      } finally {
        this.downloader.off("progress", progressHandler);
      }
    } catch (error) {
      return {
        url,
        success: false,
        videoId: extractYouTubeVideoId(url) || undefined,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private generateFilename(
    template: string,
    variables: { title: string; date: string; videoId: string }
  ): string {
    let filename = template
      .replace(/\{title\}/g, variables.title)
      .replace(/\{date\}/g, variables.date)
      .replace(/\{videoId\}/g, variables.videoId);

    // Sanitize filename for filesystem compatibility
    filename = filename
      .replace(/[<>:"/\\|?*]/g, "-")
      .replace(/\s+/g, " ")
      .trim();

    // Limit filename length
    if (filename.length > 200) {
      filename = filename.substring(0, 200).trim();
    }

    return filename;
  }

  async getDownloadHistory(limit: number = 50): Promise<any[]> {
    const videos = await this.videoRepo.findByStatus("COMPLETED");
    return videos.slice(0, limit);
  }

  async cleanupFailedDownloads(): Promise<number> {
    const failedVideos = await this.videoRepo.findByStatus("FAILED");
    let cleanedCount = 0;

    for (const video of failedVideos) {
      if (video.filePath) {
        try {
          await fs.unlink(video.filePath);
          cleanedCount++;
        } catch (error) {
          // File might not exist, continue
        }
      }
    }

    return cleanedCount;
  }
}
