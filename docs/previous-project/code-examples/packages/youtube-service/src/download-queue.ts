import { EventEmitter } from "events";
import {
  YouTubeDownloader,
  VideoInfo,
  DownloadProgress,
} from "./youtube-downloader";
import { YouTubeConfig, generateId } from "@church-copilot/shared";

export interface DownloadJob {
  id: string;
  videoId: string;
  url: string;
  title: string;
  status: "pending" | "downloading" | "completed" | "failed" | "cancelled";
  progress: number;
  filePath?: string;
  error?: string;
  addedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  priority: number; // 1 = highest, 5 = lowest
}

export class DownloadQueue extends EventEmitter {
  private downloader: YouTubeDownloader;
  private queue: DownloadJob[] = [];
  private activeDownloads = new Map<string, DownloadJob>();
  private config: YouTubeConfig;
  private isProcessing = false;

  constructor(config: YouTubeConfig) {
    super();
    this.config = config;
    this.downloader = new YouTubeDownloader(config);

    // Listen to downloader progress events
    this.downloader.on("progress", (progress: DownloadProgress) => {
      this.handleDownloadProgress(progress);
    });
  }

  /**
   * Add video to download queue
   */
  async addToQueue(
    url: string,
    options?: {
      priority?: number;
      format?: string;
      audioOnly?: boolean;
      filename?: string;
    }
  ): Promise<DownloadJob> {
    try {
      // Get video info first
      const videoInfo = await this.downloader.getVideoInfo(url);

      // Check if already in queue or downloaded
      const existingJob = this.findJobByVideoId(videoInfo.id);
      if (existingJob) {
        if (existingJob.status === "completed") {
          throw new Error("Video already downloaded");
        } else if (existingJob.status === "downloading") {
          throw new Error("Video is currently downloading");
        } else if (existingJob.status === "pending") {
          throw new Error("Video is already in queue");
        }
      }

      const job: DownloadJob = {
        id: generateId(),
        videoId: videoInfo.id,
        url,
        title: videoInfo.title,
        status: "pending",
        progress: 0,
        addedAt: new Date(),
        priority: options?.priority || 3,
      };

      // Insert job in priority order
      this.insertJobByPriority(job);

      this.emit("jobAdded", job);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }

      return job;
    } catch (error) {
      throw new Error(
        `Failed to add video to queue: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Remove job from queue
   */
  removeFromQueue(jobId: string): boolean {
    const jobIndex = this.queue.findIndex((job) => job.id === jobId);
    if (jobIndex >= 0) {
      const job = this.queue[jobIndex];

      // Cancel if currently downloading
      if (job.status === "downloading") {
        this.downloader.cancelDownload(job.videoId);
        this.activeDownloads.delete(job.videoId);
      }

      this.queue.splice(jobIndex, 1);
      job.status = "cancelled";

      this.emit("jobRemoved", job);
      return true;
    }
    return false;
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): number {
    const completedJobs = this.queue.filter(
      (job) =>
        job.status === "completed" ||
        job.status === "failed" ||
        job.status === "cancelled"
    );

    this.queue = this.queue.filter(
      (job) => job.status === "pending" || job.status === "downloading"
    );

    this.emit("queueCleared", completedJobs.length);
    return completedJobs.length;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    downloading: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    const statusCounts = {
      total: this.queue.length,
      pending: 0,
      downloading: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const job of this.queue) {
      statusCounts[job.status]++;
    }

    return statusCounts;
  }

  /**
   * Get all jobs
   */
  getJobs(): DownloadJob[] {
    return [...this.queue];
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): DownloadJob | undefined {
    return this.queue.find((job) => job.id === jobId);
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    const job = this.getJob(jobId);
    if (!job || job.status !== "failed") {
      return false;
    }

    job.status = "pending";
    job.progress = 0;
    job.error = undefined;
    job.startedAt = undefined;
    job.completedAt = undefined;

    // Reorder by priority
    this.queue = this.queue.filter((j) => j.id !== jobId);
    this.insertJobByPriority(job);

    this.emit("jobRetried", job);

    // Start processing if not running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return true;
  }

  /**
   * Pause queue processing
   */
  pauseQueue(): void {
    this.isProcessing = false;
    this.emit("queuePaused");
  }

  /**
   * Resume queue processing
   */
  resumeQueue(): void {
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Change job priority
   */
  changeJobPriority(jobId: string, newPriority: number): boolean {
    const job = this.getJob(jobId);
    if (!job || job.status !== "pending") {
      return false;
    }

    job.priority = Math.max(1, Math.min(5, newPriority));

    // Reorder queue
    this.queue = this.queue.filter((j) => j.id !== jobId);
    this.insertJobByPriority(job);

    this.emit("jobPriorityChanged", job);
    return true;
  }

  /**
   * Process the download queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.emit("queueStarted");

    while (this.hasNextJob() && this.canStartNewDownload()) {
      const job = this.getNextJob();
      if (!job) break;

      try {
        await this.downloadJob(job);
      } catch (error) {
        console.error("Error processing job:", error);
        job.status = "failed";
        job.error = error instanceof Error ? error.message : "Unknown error";
        job.completedAt = new Date();
        this.emit("jobFailed", job);
      }
    }

    this.isProcessing = false;
    this.emit("queueStopped");
  }

  /**
   * Download a specific job
   */
  private async downloadJob(job: DownloadJob): Promise<void> {
    job.status = "downloading";
    job.startedAt = new Date();
    this.activeDownloads.set(job.videoId, job);

    this.emit("jobStarted", job);

    try {
      const filePath = await this.downloader.downloadVideo(job.url, {
        format: this.config.preferredFormat,
        audioOnly: this.config.audioOnly,
        outputPath: this.config.downloadPath,
      });

      job.status = "completed";
      job.progress = 100;
      job.filePath = filePath;
      job.completedAt = new Date();

      this.activeDownloads.delete(job.videoId);
      this.emit("jobCompleted", job);
    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : "Unknown error";
      job.completedAt = new Date();

      this.activeDownloads.delete(job.videoId);
      this.emit("jobFailed", job);
      throw error;
    }
  }

  /**
   * Handle download progress updates
   */
  private handleDownloadProgress(progress: DownloadProgress): void {
    const job = this.activeDownloads.get(progress.videoId);
    if (job) {
      job.progress = progress.percentage;

      if (progress.status === "error") {
        job.status = "failed";
        job.error = progress.error;
        job.completedAt = new Date();
        this.activeDownloads.delete(progress.videoId);
        this.emit("jobFailed", job);
      }

      this.emit("jobProgress", job);
    }
  }

  /**
   * Check if there are jobs to process
   */
  private hasNextJob(): boolean {
    return this.queue.some((job) => job.status === "pending");
  }

  /**
   * Check if we can start a new download
   */
  private canStartNewDownload(): boolean {
    return this.activeDownloads.size < this.config.maxConcurrentDownloads;
  }

  /**
   * Get the next job to process
   */
  private getNextJob(): DownloadJob | undefined {
    return this.queue.find((job) => job.status === "pending");
  }

  /**
   * Find job by video ID
   */
  private findJobByVideoId(videoId: string): DownloadJob | undefined {
    return this.queue.find((job) => job.videoId === videoId);
  }

  /**
   * Update configuration and downloader
   */
  updateConfig(newConfig: YouTubeConfig): void {
    this.config = { ...newConfig };
    this.downloader.updateConfig(newConfig);
  }

  /**
   * Insert job in priority order
   */
  private insertJobByPriority(job: DownloadJob): void {
    // Find the correct position based on priority (1 = highest)
    const insertIndex = this.queue.findIndex(
      (existingJob) =>
        existingJob.priority > job.priority ||
        (existingJob.priority === job.priority &&
          existingJob.addedAt > job.addedAt)
    );

    if (insertIndex === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIndex, 0, job);
    }
  }
}
