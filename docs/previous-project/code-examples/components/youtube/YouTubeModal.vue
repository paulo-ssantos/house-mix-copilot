<template>
  <UModal v-model="isOpen" :ui="{ width: 'max-w-2xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">YouTube Integration</h3>
          <UButton
            icon="i-heroicons-x-mark"
            size="sm"
            color="gray"
            variant="ghost"
            @click="closeModal"
          />
        </div>
      </template>

      <div class="space-y-6">
        <!-- URL Input -->
        <div>
          <label class="block text-sm font-medium mb-2">YouTube URL</label>
          <div class="flex space-x-2">
            <UInput
              v-model="youtubeUrl"
              placeholder="https://www.youtube.com/watch?v=..."
              class="flex-1"
              :disabled="isLoading"
            />
            <UButton
              icon="i-heroicons-magnifying-glass"
              :loading="isLoadingInfo"
              :disabled="!youtubeUrl || isLoading"
              @click="fetchVideoInfo"
            >
              Info
            </UButton>
          </div>
        </div>

        <!-- Video Preview -->
        <div v-if="videoInfo" class="border rounded-lg p-4">
          <div class="flex space-x-4">
            <img
              v-if="videoInfo.thumbnail"
              :src="videoInfo.thumbnail"
              :alt="videoInfo.title"
              class="w-24 h-18 object-cover rounded"
            />
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-sm truncate">
                {{ videoInfo.title }}
              </h4>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {{ videoInfo.channel }} •
                {{ formatDuration(videoInfo.duration) }}
              </p>
              <p
                v-if="videoInfo.description"
                class="text-xs text-gray-500 mt-2 line-clamp-2"
              >
                {{ videoInfo.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Download Options -->
        <div v-if="videoInfo" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2"
              >Download Quality</label
            >
            <USelect
              v-model="selectedQuality"
              :options="qualityOptions"
              :disabled="isLoading"
            />
          </div>

          <div class="flex items-center space-x-4">
            <UCheckbox
              v-model="audioOnly"
              label="Audio Only"
              :disabled="isLoading"
            />
            <UCheckbox
              v-model="includeSubtitles"
              label="Include Subtitles"
              :disabled="isLoading"
            />
          </div>
        </div>

        <!-- Current Downloads Queue -->
        <div v-if="downloads.length > 0" class="space-y-4">
          <h4 class="font-semibold text-sm">Current Downloads</h4>
          <div class="space-y-2">
            <div
              v-for="download in downloads"
              :key="download.id"
              class="border rounded p-3"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium truncate">{{
                  download.title
                }}</span>
                <div class="flex items-center space-x-2">
                  <span class="text-xs text-gray-500">{{
                    download.status
                  }}</span>
                  <UButton
                    v-if="
                      download.status === 'queued' ||
                      download.status === 'downloading'
                    "
                    icon="i-heroicons-x-mark"
                    size="xs"
                    color="red"
                    variant="ghost"
                    @click="cancelDownload(download.id)"
                  />
                </div>
              </div>
              <UProgress
                v-if="download.status === 'downloading'"
                :value="download.progress"
                size="sm"
              />
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
          :close-button="{ icon: 'i-heroicons-x-mark', color: 'red' }"
          @close="error = null"
        />
      </div>

      <template #footer>
        <div class="flex justify-between">
          <UButton variant="ghost" color="gray" @click="closeModal">
            Cancel
          </UButton>
          <UButton
            v-if="videoInfo"
            icon="i-heroicons-arrow-down-tray"
            :loading="isLoading"
            :disabled="!videoInfo"
            @click="startDownload"
          >
            Download
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { YouTubeVideo } from "@church-copilot/shared";

interface Props {
  modelValue: boolean;
  initialUrl?: string;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "download-started", video: YouTubeVideo): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Reactive state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const youtubeUrl = ref(props.initialUrl || "");
const videoInfo = ref<YouTubeVideo | null>(null);
const selectedQuality = ref("best[height<=720]");
const audioOnly = ref(false);
const includeSubtitles = ref(true);
const isLoadingInfo = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);
const downloads = ref<
  Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
  }>
>([]);

// Options
const qualityOptions = [
  { label: "Best (1080p)", value: "best[height<=1080]" },
  { label: "High (720p)", value: "best[height<=720]" },
  { label: "Medium (480p)", value: "best[height<=480]" },
  { label: "Low (360p)", value: "best[height<=360]" },
  { label: "Audio Only", value: "bestaudio/best" },
];

// Methods
const closeModal = () => {
  isOpen.value = false;
  resetForm();
};

const resetForm = () => {
  youtubeUrl.value = "";
  videoInfo.value = null;
  selectedQuality.value = "best[height<=720]";
  audioOnly.value = false;
  includeSubtitles.value = true;
  error.value = null;
};

const fetchVideoInfo = async () => {
  if (!youtubeUrl.value) return;

  isLoadingInfo.value = true;
  error.value = null;

  try {
    const response = await $fetch<{
      success: boolean;
      data: YouTubeVideo;
      error?: string;
    }>("/api/youtube/info", {
      method: "POST",
      body: { url: youtubeUrl.value },
    });

    if (response.success && response.data) {
      videoInfo.value = response.data;
    } else {
      error.value = response.error || "Failed to fetch video information";
    }
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to fetch video information";
  } finally {
    isLoadingInfo.value = false;
  }
};

const startDownload = async () => {
  if (!videoInfo.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    const response = await $fetch<{
      success: boolean;
      data: any;
      error?: string;
    }>("/api/youtube/download", {
      method: "POST",
      body: {
        url: youtubeUrl.value,
        quality: selectedQuality.value,
        audioOnly: audioOnly.value,
        subtitles: includeSubtitles.value,
      },
    });

    if (response.success) {
      emit("download-started", videoInfo.value);
      closeModal();
      // Start polling for download status
      startPollingQueue();
    } else {
      error.value = response.error || "Failed to start download";
    }
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to start download";
  } finally {
    isLoading.value = false;
  }
};

const cancelDownload = async (downloadId: string) => {
  try {
    await $fetch(`/api/youtube/cancel`, {
      method: "DELETE",
      body: { id: downloadId },
    });

    // Remove from local list
    downloads.value = downloads.value.filter((d) => d.id !== downloadId);
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to cancel download";
  }
};

const fetchQueue = async () => {
  try {
    const response = await $fetch<{ success: boolean; data: any[] }>(
      "/api/youtube/queue"
    );
    if (response.success) {
      downloads.value = response.data || [];
    }
  } catch (err) {
    // Silently fail queue updates
  }
};

let pollingInterval: NodeJS.Timeout | null = null;

const startPollingQueue = () => {
  if (pollingInterval) return;

  pollingInterval = setInterval(fetchQueue, 2000);
};

const stopPollingQueue = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

// Watchers
watch(
  () => props.initialUrl,
  (newUrl) => {
    if (newUrl) {
      youtubeUrl.value = newUrl;
    }
  }
);

watch(isOpen, (newValue) => {
  if (newValue) {
    fetchQueue();
    startPollingQueue();
  } else {
    stopPollingQueue();
  }
});

// Lifecycle
onMounted(() => {
  if (isOpen.value) {
    fetchQueue();
    startPollingQueue();
  }
});

onUnmounted(() => {
  stopPollingQueue();
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
