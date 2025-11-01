import type { YouTubeVideo } from "@church-copilot/shared";

export interface YouTubeDownload {
  id: string;
  videoId: string;
  title: string;
  status: "queued" | "downloading" | "completed" | "failed" | "cancelled";
  progress: number;
  error?: string;
  filePath?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface YouTubeComposableState {
  downloads: Ref<YouTubeDownload[]>;
  isPolling: Ref<boolean>;
  lastError: Ref<string | null>;
}

export const useYouTube = (): {
  // State
  downloads: Ref<YouTubeDownload[]>;
  isPolling: Ref<boolean>;
  lastError: Ref<string | null>;

  // Methods
  getVideoInfo: (url: string) => Promise<YouTubeVideo | null>;
  startDownload: (options: {
    url: string;
    quality?: string;
    audioOnly?: boolean;
    subtitles?: boolean;
  }) => Promise<boolean>;
  cancelDownload: (downloadId: string) => Promise<boolean>;
  getDownloadQueue: () => Promise<YouTubeDownload[]>;
  startPolling: () => void;
  stopPolling: () => void;
  clearError: () => void;
} => {
  const downloads = ref<YouTubeDownload[]>([]);
  const isPolling = ref(false);
  const lastError = ref<string | null>(null);

  let pollingInterval: NodeJS.Timeout | null = null;

  const clearError = () => {
    lastError.value = null;
  };

  const getVideoInfo = async (url: string): Promise<YouTubeVideo | null> => {
    try {
      clearError();

      const response = await $fetch<{
        success: boolean;
        data: YouTubeVideo;
        error?: string;
      }>("/api/youtube/info", {
        method: "POST",
        body: { url },
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        lastError.value = response.error || "Failed to fetch video information";
        return null;
      }
    } catch (error) {
      lastError.value =
        error instanceof Error
          ? error.message
          : "Failed to fetch video information";
      return null;
    }
  };

  const startDownload = async (options: {
    url: string;
    quality?: string;
    audioOnly?: boolean;
    subtitles?: boolean;
  }): Promise<boolean> => {
    try {
      clearError();

      const response = await $fetch<{
        success: boolean;
        data: any;
        error?: string;
      }>("/api/youtube/download", {
        method: "POST",
        body: {
          url: options.url,
          quality: options.quality || "best[height<=720]",
          audioOnly: options.audioOnly || false,
          subtitles: options.subtitles !== false, // Default to true
        },
      });

      if (response.success) {
        // Refresh queue immediately
        await getDownloadQueue();
        return true;
      } else {
        lastError.value = response.error || "Failed to start download";
        return false;
      }
    } catch (error) {
      lastError.value =
        error instanceof Error ? error.message : "Failed to start download";
      return false;
    }
  };

  const cancelDownload = async (downloadId: string): Promise<boolean> => {
    try {
      clearError();

      const response = await $fetch<{
        success: boolean;
        error?: string;
      }>(`/api/youtube/cancel`, {
        method: "DELETE",
        body: { id: downloadId },
      });

      if (response.success) {
        // Remove from local state immediately for better UX
        downloads.value = downloads.value.filter((d) => d.id !== downloadId);
        return true;
      } else {
        lastError.value = response.error || "Failed to cancel download";
        return false;
      }
    } catch (error) {
      lastError.value =
        error instanceof Error ? error.message : "Failed to cancel download";
      return false;
    }
  };

  const getDownloadQueue = async (): Promise<YouTubeDownload[]> => {
    try {
      const response = await $fetch<{
        success: boolean;
        data: YouTubeDownload[];
        error?: string;
      }>("/api/youtube/queue");

      if (response.success && response.data) {
        downloads.value = response.data;
        return response.data;
      } else {
        // Don't set error for queue polling failures
        return downloads.value;
      }
    } catch (error) {
      // Silently fail queue updates to avoid interrupting user experience
      return downloads.value;
    }
  };

  const startPolling = (intervalMs: number = 2000) => {
    if (pollingInterval) return; // Already polling

    isPolling.value = true;

    // Initial fetch
    getDownloadQueue();

    pollingInterval = setInterval(() => {
      getDownloadQueue();
    }, intervalMs);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    isPolling.value = false;
  };

  // Auto-cleanup on unmount
  if (process.client) {
    onUnmounted(() => {
      stopPolling();
    });
  }

  return {
    // State
    downloads,
    isPolling,
    lastError,

    // Methods
    getVideoInfo,
    startDownload,
    cancelDownload,
    getDownloadQueue,
    startPolling,
    stopPolling,
    clearError,
  };
};
