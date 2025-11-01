import { promises as fs, createWriteStream } from "fs";
import path from "path";
import { EventEmitter } from "events";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import ytdl from "@distube/ytdl-core";
import {
  YouTubeConfig,
  extractYouTubeVideoId,
  isValidYouTubeUrl,
  sanitizeFilename,
  formatBytes,
} from "@church-copilot/shared";

export interface VideoInfo {
  id: string;
  title: string;
  description?: string;
  duration: number; // seconds
  thumbnailUrl?: string;
  channelName?: string;
  publishedAt?: Date;
  formats: VideoFormat[];
}

export interface VideoFormat {
  formatId: string;
  ext: string;
  resolution?: string;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  quality: string;
}

export interface DownloadProgress {
  videoId: string;
  percentage: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: string;
  eta: string;
  status: "downloading" | "processing" | "completed" | "error";
  error?: string;
}

export interface DownloadOptions {
  format?: string;
  audioOnly?: boolean;
  outputPath?: string;
  filename?: string;
}

export class YouTubeDownloader extends EventEmitter {
  private config: YouTubeConfig;
  private activeDownloads = new Map<string, any>();

  constructor(config: YouTubeConfig) {
    super();
    this.config = config;
    // Only ensure directory if path is provided and not empty
    if (this.config.downloadPath && this.config.downloadPath.trim()) {
      this.ensureDownloadDir().catch(console.warn);
    }
  }

  /**
   * Ensure download directory exists
   */
  private async ensureDownloadDir(): Promise<void> {
    if (this.config.downloadPath) {
      try {
        await fs.mkdir(this.config.downloadPath, { recursive: true });
      } catch (error) {
        console.warn("Failed to create download directory:", error);
      }
    }
  }

  /**
   * Check if ytdl-core is available (always true since it's a Node.js package)
   */
  async isYtDlpAvailable(): Promise<boolean> {
    try {
      // Test by attempting to validate a dummy YouTube URL format
      return ytdl.validateURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    } catch (error) {
      console.error("ytdl-core validation failed:", error);
      return false;
    }
  }

  /**
   * Get video information without downloading
   */
  async getVideoInfo(url: string): Promise<VideoInfo> {
    if (!isValidYouTubeUrl(url)) {
      throw new Error("Invalid YouTube URL");
    }

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      throw new Error("Could not extract video ID from URL");
    }

    try {
      // Get video info using ytdl-core
      const info = await ytdl.getInfo(url);
      const videoDetails = info.videoDetails;

      // Parse formats
      const formats: VideoFormat[] = info.formats.map((format) => ({
        formatId: format.itag.toString(),
        ext: format.container || "mp4",
        resolution: format.qualityLabel || undefined,
        filesize: format.contentLength
          ? parseInt(format.contentLength)
          : undefined,
        fps: format.fps || undefined,
        vcodec: format.videoCodec || undefined,
        acodec: format.audioCodec || undefined,
        quality: format.qualityLabel || format.quality || "unknown",
      }));

      return {
        id: videoId,
        title: videoDetails.title || "Unknown Title",
        description: videoDetails.description || undefined,
        duration: parseInt(videoDetails.lengthSeconds) || 0,
        thumbnailUrl: videoDetails.thumbnails?.[0]?.url,
        channelName: videoDetails.author.name,
        publishedAt: new Date(videoDetails.publishDate),
        formats,
      };
    } catch (error) {
      console.error("Error getting video info:", error);
      throw new Error(
        `Failed to get video information: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Download video
   */
  async downloadVideo(url: string, options?: DownloadOptions): Promise<string> {
    if (!isValidYouTubeUrl(url)) {
      throw new Error("Invalid YouTube URL");
    }

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      throw new Error("Could not extract video ID from URL");
    }

    if (this.activeDownloads.has(videoId)) {
      throw new Error("Video is already being downloaded");
    }

    try {
      // Get video info first
      const videoInfo = await this.getVideoInfo(url);

      // Prepare download options
      const outputPath = options?.outputPath || this.config.downloadPath;
      const filename = options?.filename || sanitizeFilename(videoInfo.title);

      // Ensure output directory exists
      await fs.mkdir(outputPath, { recursive: true });

      // Determine quality based on options
      let quality: string = "highest";
      if (options?.audioOnly) {
        quality = "lowestaudio";
      } else if (options?.format) {
        // Map format to quality
        if (options.format.includes("720")) {
          quality = "highestvideo";
        } else if (options.format.includes("480")) {
          quality = "highestvideo";
        } else {
          quality = "highest";
        }
      }

      const outputFilePath = path.join(outputPath, `${filename}.mp4`);

      return new Promise((resolve, reject) => {
        let lastProgress: DownloadProgress = {
          videoId,
          percentage: 0,
          downloadedBytes: 0,
          totalBytes: 0,
          speed: "0B/s",
          eta: "Unknown",
          status: "downloading",
        };

        // Create download stream
        const downloadStream = ytdl(url, {
          quality: quality as any,
          filter: options?.audioOnly ? "audioonly" : "videoandaudio",
        });

        // Create write stream
        const writeStream = createWriteStream(outputFilePath);

        // Track this download
        this.activeDownloads.set(videoId, {
          kill: () => {
            downloadStream.destroy();
            writeStream.destroy();
          },
        } as any);

        let downloadedBytes = 0;
        let totalBytes = 0;
        let startTime = Date.now();

        downloadStream.on("info", (info: any) => {
          try {
            if (info && info.format && info.format.itag && info.formats) {
              const format = info.formats.find(
                (f: any) =>
                  f &&
                  f.itag &&
                  f.itag.toString() === info.format.itag.toString()
              );
              totalBytes = parseInt(format?.contentLength || "0") || 0;
            } else if (info && info.formats && info.formats.length > 0) {
              // Fallback: use the first format if we can't match by itag
              const firstFormat = info.formats[0];
              totalBytes = parseInt(firstFormat?.contentLength || "0") || 0;
            }
            lastProgress.totalBytes = totalBytes;
          } catch (error) {
            console.warn("Error processing video info:", error);
            // Continue without setting totalBytes, progress will still work
          }
        });

        downloadStream.on("data", (chunk) => {
          downloadedBytes += chunk.length;
          lastProgress.downloadedBytes = downloadedBytes;

          if (totalBytes > 0) {
            lastProgress.percentage = Math.round(
              (downloadedBytes / totalBytes) * 100
            );
          }

          // Calculate speed
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed > 0) {
            const bytesPerSecond = downloadedBytes / elapsed;
            lastProgress.speed = formatBytes(bytesPerSecond) + "/s";

            if (bytesPerSecond > 0 && totalBytes > 0) {
              const remainingSeconds =
                (totalBytes - downloadedBytes) / bytesPerSecond;
              lastProgress.eta = this.formatTime(remainingSeconds);
            }
          }

          this.emit("progress", lastProgress);
        });

        downloadStream.on("error", (error) => {
          this.activeDownloads.delete(videoId);
          writeStream.destroy();

          lastProgress.status = "error";
          lastProgress.error = error.message;
          this.emit("progress", lastProgress);
          reject(error);
        });

        writeStream.on("finish", () => {
          this.activeDownloads.delete(videoId);

          lastProgress.status = "completed";
          lastProgress.percentage = 100;
          this.emit("progress", lastProgress);
          resolve(outputFilePath);
        });

        writeStream.on("error", (error: Error) => {
          this.activeDownloads.delete(videoId);
          downloadStream.destroy();

          lastProgress.status = "error";
          lastProgress.error = error.message;
          this.emit("progress", lastProgress);
          reject(error);
        });

        // Pipe the download
        downloadStream.pipe(writeStream);
      });
    } catch (error) {
      this.activeDownloads.delete(videoId);
      throw error;
    }
  }

  /**
   * Cancel download
   */
  cancelDownload(videoId: string): boolean {
    const process = this.activeDownloads.get(videoId);
    if (process) {
      process.kill("SIGTERM");
      this.activeDownloads.delete(videoId);
      this.emit("progress", {
        videoId,
        percentage: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        speed: "0B/s",
        eta: "Cancelled",
        status: "error",
        error: "Download cancelled by user",
      });
      return true;
    }
    return false;
  }

  /**
   * Get active downloads
   */
  getActiveDownloads(): string[] {
    return Array.from(this.activeDownloads.keys());
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<YouTubeConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.config.downloadPath && this.config.downloadPath.trim()) {
      this.ensureDownloadDir().catch(console.warn);
    }
  }

  /**
   * Get available formats for a video
   */
  async getAvailableFormats(url: string): Promise<VideoFormat[]> {
    try {
      const info = await ytdl.getInfo(url);
      return info.formats.map((format) => ({
        formatId: format.itag.toString(),
        ext: format.container || "mp4",
        resolution: format.qualityLabel || undefined,
        filesize: format.contentLength
          ? parseInt(format.contentLength)
          : undefined,
        fps: format.fps || undefined,
        vcodec: format.videoCodec || undefined,
        acodec: format.audioCodec || undefined,
        quality: format.qualityLabel || format.quality || "unknown",
      }));
    } catch (error) {
      console.error("Error getting available formats:", error);
      return [];
    }
  }

  /**
   * Check disk space in download directory
   */
  async checkDiskSpace(): Promise<{
    free: number;
    total: number;
    used: number;
    freeFormatted: string;
    totalFormatted: string;
  }> {
    try {
      const stats = await fs.stat(this.config.downloadPath);
      // Note: This is a simplified implementation
      // For actual disk space checking, you'd need platform-specific solutions
      return {
        free: 0,
        total: 0,
        used: 0,
        freeFormatted: "Unknown",
        totalFormatted: "Unknown",
      };
    } catch (error) {
      throw new Error("Failed to check disk space");
    }
  }

  /**
   * Clean up old downloads
   */
  async cleanupOldDownloads(olderThanDays: number = 30): Promise<number> {
    try {
      const files = await fs.readdir(this.config.downloadPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.config.downloadPath, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up downloads:", error);
      return 0;
    }
  }

  /**
   * Parse upload date from yt-dlp format
   */
  private parseUploadDate(dateStr: string): Date {
    // yt-dlp returns dates in YYYYMMDD format
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }

  /**
   * Format time in seconds to human readable string
   */
  private formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return "Unknown";

    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const mins = Math.round(seconds / 60);
      return `${mins}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.round((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
  }

  /**
   * Parse formats from video info
   */
  private parseFormats(formats: any[]): VideoFormat[] {
    return formats.map((format) => ({
      formatId: format.format_id,
      ext: format.ext,
      resolution: format.resolution,
      fps: format.fps,
      vcodec: format.vcodec,
      acodec: format.acodec,
      filesize: format.filesize,
      quality: format.quality || "unknown",
    }));
  }

  /**
   * Parse formats from yt-dlp list output
   */
  private parseFormatsFromList(output: string): VideoFormat[] {
    const formats: VideoFormat[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      const match = line.match(/^(\S+)\s+(\S+)\s+([^|]+)\|/);
      if (match) {
        formats.push({
          formatId: match[1],
          ext: match[2],
          quality: match[3].trim(),
        });
      }
    }

    return formats;
  }
}
