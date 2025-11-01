<template>
  <UCard class="h-full flex flex-col">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          YouTube Downloads
        </h2>
        <div class="flex items-center space-x-2">
          <UBadge v-if="totalActiveDownloads > 0" color="yellow" variant="soft">
            {{ totalActiveDownloads }} Active
          </UBadge>
          <UButton
            v-if="completedDownloads.length > 0"
            icon="i-heroicons-trash"
            size="xs"
            color="red"
            variant="ghost"
            @click="confirmBulkDelete"
            title="Clear All Downloads"
          />
          <UButton
            icon="i-heroicons-arrow-path"
            size="xs"
            color="gray"
            variant="ghost"
            :loading="isLoading"
            @click="fetchProgress"
            title="Refresh"
          />
        </div>
      </div>
    </template>

    <div class="space-y-4 flex-1 overflow-auto">
      <!-- Overall Progress Bar -->
      <div
        v-if="totalActiveDownloads > 0"
        class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-blue-800 dark:text-blue-200">
            Overall Progress
          </span>
          <span class="text-sm text-blue-700 dark:text-blue-300">
            {{ overallProgress }}%
          </span>
        </div>
        <div class="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
          <div
            class="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${overallProgress}%` }"
          ></div>
        </div>
      </div>

      <!-- Active Downloads -->
      <div v-if="activeDownloads.length > 0">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Downloading Now ({{ activeDownloads.length }})
        </h3>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="download in activeDownloads"
            :key="download.videoId"
            class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1 min-w-0">
                <h4
                  class="text-sm font-medium text-gray-900 dark:text-white truncate"
                >
                  {{ download.title || "Loading..." }}
                </h4>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ download.url }}
                </p>
              </div>
              <span
                class="text-xs px-2 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded ml-2"
              >
                {{ download.progress }}%
              </span>
            </div>
            <UProgress :value="download.progress" size="sm" color="yellow" />
          </div>
        </div>
      </div>

      <!-- Pending Downloads -->
      <div v-if="pendingDownloads.length > 0">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          In Queue ({{ pendingDownloads.length }})
        </h3>
        <div class="space-y-1 max-h-32 overflow-y-auto">
          <div
            v-for="download in pendingDownloads"
            :key="download.videoId"
            class="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs text-gray-600 dark:text-gray-300 truncate flex-1"
              >
                {{ download.title || "Waiting..." }}
              </span>
              <span
                class="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded ml-2"
              >
                Pending
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Completed Downloads -->
      <div v-if="completedDownloads.length > 0">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Recent Downloads ({{ completedDownloads.length }})
          </h3>
          <UButton
            icon="i-heroicons-folder-open"
            size="xs"
            color="gray"
            variant="ghost"
            @click="openDownloadsFolder"
            title="Open Downloads Folder"
          />
        </div>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          <div
            v-for="download in completedDownloads.slice(0, 5)"
            :key="download.videoId"
            class="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded"
          >
            <div class="flex items-center justify-between mb-1">
              <div class="flex-1 min-w-0">
                <h4
                  class="text-xs font-medium text-gray-900 dark:text-white truncate"
                >
                  {{ download.title }}
                </h4>
                <p
                  v-if="download.filePath"
                  class="text-xs text-green-600 dark:text-green-400 truncate"
                >
                  📁 {{ getFileName(download.filePath) }}
                </p>
              </div>
              <span
                class="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded ml-2"
              >
                ✓ Done
              </span>
            </div>
            <div class="flex items-center space-x-1">
              <UButton
                icon="i-heroicons-play"
                size="xs"
                color="green"
                variant="ghost"
                :disabled="!download.filePath"
                @click="download.filePath && openFile(download.filePath)"
                title="Open File"
              />
              <UButton
                icon="i-heroicons-folder"
                size="xs"
                color="gray"
                variant="ghost"
                :disabled="!download.filePath"
                @click="
                  download.filePath && openFileLocation(download.filePath)
                "
                title="Show in Folder"
              />
              <UButton
                icon="i-heroicons-link"
                size="xs"
                color="blue"
                variant="ghost"
                @click="openYouTubeUrl(download.url)"
                title="Open YouTube"
              />
              <UButton
                icon="i-heroicons-trash"
                size="xs"
                color="red"
                variant="ghost"
                @click="confirmDeleteVideo(download.videoId, download.title)"
                title="Delete Video"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="
          activeDownloads.length === 0 &&
          pendingDownloads.length === 0 &&
          completedDownloads.length === 0
        "
        class="text-center py-6 text-gray-500 dark:text-gray-400"
      >
        <div class="text-2xl mb-2">📺</div>
        <p class="text-sm">No YouTube downloads yet</p>
        <p class="text-xs mt-1">Downloads will appear here automatically</p>
      </div>

      <!-- Statistics -->
      <div
        v-if="totalDownloads > 0"
        class="pt-3 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
              {{ totalDownloads }}
            </div>
            <div class="text-xs text-blue-800 dark:text-blue-200">Total</div>
          </div>
          <div class="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <div class="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {{ activeDownloads.length }}
            </div>
            <div class="text-xs text-yellow-800 dark:text-yellow-200">
              Active
            </div>
          </div>
          <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ completedDownloads.length }}
            </div>
            <div class="text-xs text-green-800 dark:text-green-200">Done</div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="red"
        variant="soft"
        :title="error"
        :close-button="{
          icon: 'i-heroicons-x-mark-20-solid',
          color: 'gray',
          variant: 'link',
          padded: false,
        }"
        @close="error = null"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useYouTubeDownloadProgress } from "~/composables/useYouTubeProgress";

// Use the existing composable
const {
  activeDownloads,
  pendingDownloads,
  completedDownloads,
  isLoading,
  error,
  hasActiveDownloads,
  hasPendingDownloads,
  totalActiveDownloads,
  overallProgress,
  fetchProgress,
  startPolling,
  stopPolling,
  deleteVideo,
  bulkDelete,
} = useYouTubeDownloadProgress();

// Local computed properties
const totalDownloads = computed(
  () =>
    activeDownloads.value.length +
    pendingDownloads.value.length +
    completedDownloads.value.length
);

// Utility functions
const getFileName = (filePath: string): string => {
  if (!filePath) return "Unknown file";
  return filePath.split("/").pop() || "Unknown file";
};

const openFile = async (filePath: string) => {
  if (!filePath) return;

  try {
    // Use electron's shell.openPath or browser open
    // @ts-ignore - $fetch is available via Nuxt auto-imports
    await $fetch("/api/system/open-file", {
      method: "POST",
      body: { filePath },
    });
  } catch (err) {
    console.error("Failed to open file:", err);
  }
};

const openFileLocation = async (filePath: string) => {
  if (!filePath) return;

  try {
    // Use electron's shell.showItemInFolder or browser open folder
    // @ts-ignore - $fetch is available via Nuxt auto-imports
    await $fetch("/api/system/show-in-folder", {
      method: "POST",
      body: { filePath },
    });
  } catch (err) {
    console.error("Failed to show file location:", err);
  }
};

const openDownloadsFolder = async () => {
  try {
    // @ts-ignore - $fetch is available via Nuxt auto-imports
    await $fetch("/api/system/open-downloads-folder", {
      method: "POST",
    });
  } catch (err) {
    console.error("Failed to open downloads folder:", err);
  }
};

const openYouTubeUrl = (url: string) => {
  if (url) {
    window.open(url, "_blank");
  }
};

// Delete confirmation and methods
const confirmDeleteVideo = async (videoId: string, title: string) => {
  const confirmed = confirm(
    `Are you sure you want to delete "${title}"?\n\nThis will remove the video file and its database record. This action cannot be undone.`
  );

  if (confirmed) {
    const success = await deleteVideo(videoId);
    if (success) {
      // Success feedback could be shown here
      console.log(`Successfully deleted video: ${title}`);
    } else {
      // Error handling - error is already set in the composable
      console.error(`Failed to delete video: ${title}`);
    }
  }
};

const confirmBulkDelete = async () => {
  const confirmed = confirm(
    `Are you sure you want to delete all ${completedDownloads.value.length} completed downloads?\n\nThis will remove all video files and database records. This action cannot be undone.`
  );

  if (confirmed) {
    const result = await bulkDelete("deleteAll");
    if (result.success) {
      console.log(
        `Successfully deleted ${result.deletedCount} videos and ${result.deletedFiles} files`
      );
      if (result.errors && result.errors.length > 0) {
        console.warn("Some errors occurred:", result.errors);
      }
    } else {
      console.error("Failed to perform bulk delete");
    }
  }
};

// Lifecycle
onMounted(() => {
  // Start polling for updates every 2 seconds
  startPolling(2000);
});

onUnmounted(() => {
  stopPolling();
});
</script>
