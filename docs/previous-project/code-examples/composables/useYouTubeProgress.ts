import { ref, onUnmounted, computed, readonly } from "vue";

interface DownloadProgress {
  videoId: string;
  title: string;
  status: "PENDING" | "DOWNLOADING" | "COMPLETED" | "FAILED";
  progress: number;
  url: string;
  filePath?: string;
}

interface DownloadProgressResponse {
  success: boolean;
  downloads: {
    active: DownloadProgress[];
    pending: DownloadProgress[];
    completed: DownloadProgress[];
  };
}

export const useYouTubeDownloadProgress = () => {
  const activeDownloads = ref<DownloadProgress[]>([]);
  const pendingDownloads = ref<DownloadProgress[]>([]);
  const completedDownloads = ref<DownloadProgress[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  let pollInterval: NodeJS.Timeout | null = null;

  // Fetch progress from API
  const fetchProgress = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      // @ts-ignore - $fetch is available via Nuxt auto-imports
      const response = await $fetch<DownloadProgressResponse>(
        "/api/youtube/progress"
      );

      if (response.success) {
        activeDownloads.value = response.downloads.active;
        pendingDownloads.value = response.downloads.pending;
        completedDownloads.value = response.downloads.completed.slice(0, 10); // Show only recent 10
      }
    } catch (err) {
      console.error("Failed to fetch download progress:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to fetch progress";
    } finally {
      isLoading.value = false;
    }
  };

  // Start polling for progress updates
  const startPolling = (intervalMs: number = 2000) => {
    if (pollInterval) return; // Already polling

    // Initial fetch
    fetchProgress();

    // Start polling
    pollInterval = setInterval(fetchProgress, intervalMs);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  // Get progress for a specific video
  const getVideoProgress = async (
    videoId: string
  ): Promise<DownloadProgress | null> => {
    try {
      // @ts-ignore - $fetch is available via Nuxt auto-imports
      const response = await $fetch<{
        success: boolean;
        progress: DownloadProgress;
      }>(`/api/youtube/progress?videoId=${videoId}`);
      return response.success ? response.progress : null;
    } catch (err) {
      console.error(`Failed to fetch progress for video ${videoId}:`, err);
      return null;
    }
  };

  // Computed properties for easy access
  const hasActiveDownloads = computed(() => activeDownloads.value.length > 0);
  const hasPendingDownloads = computed(() => pendingDownloads.value.length > 0);
  const totalActiveDownloads = computed(
    () => activeDownloads.value.length + pendingDownloads.value.length
  );

  const overallProgress = computed(() => {
    const total = activeDownloads.value.length;
    if (total === 0) return 100;

    const totalProgress = activeDownloads.value.reduce(
      (sum, download) => sum + download.progress,
      0
    );
    return Math.round(totalProgress / total);
  });

  // Delete a single video
  const deleteVideo = async (videoId: string): Promise<boolean> => {
    try {
      // @ts-ignore - $fetch is available via Nuxt auto-imports
      const response = await $fetch<{
        success: boolean;
        message: string;
      }>("/api/youtube/delete", {
        method: "POST",
        body: { videoId },
      });

      if (response.success) {
        // Refresh the progress data
        await fetchProgress();
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Failed to delete video ${videoId}:`, err);
      error.value =
        err instanceof Error ? err.message : "Failed to delete video";
      return false;
    }
  };

  // Bulk delete operations
  const bulkDelete = async (
    action: "deleteAll" | "deleteSelected",
    videoIds?: string[]
  ): Promise<{
    success: boolean;
    deletedCount: number;
    deletedFiles: number;
    errors?: string[];
  }> => {
    try {
      // @ts-ignore - $fetch is available via Nuxt auto-imports
      const response = await $fetch<{
        success: boolean;
        message: string;
        deletedCount: number;
        deletedFiles: number;
        errors?: string[];
      }>("/api/youtube/bulk-delete", {
        method: "POST",
        body: { action, videoIds },
      });

      if (response.success) {
        // Refresh the progress data
        await fetchProgress();
      }

      return {
        success: response.success,
        deletedCount: response.deletedCount,
        deletedFiles: response.deletedFiles,
        errors: response.errors,
      };
    } catch (err) {
      console.error("Failed to perform bulk delete:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to perform bulk delete";
      return {
        success: false,
        deletedCount: 0,
        deletedFiles: 0,
        errors: [err instanceof Error ? err.message : "Unknown error"],
      };
    }
  };

  // Cleanup on unmount
  onUnmounted(() => {
    stopPolling();
  });

  return {
    // State
    activeDownloads: readonly(activeDownloads),
    pendingDownloads: readonly(pendingDownloads),
    completedDownloads: readonly(completedDownloads),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    hasActiveDownloads,
    hasPendingDownloads,
    totalActiveDownloads,
    overallProgress,

    // Methods
    fetchProgress,
    startPolling,
    stopPolling,
    getVideoProgress,
    deleteVideo,
    bulkDelete,
  };
};
