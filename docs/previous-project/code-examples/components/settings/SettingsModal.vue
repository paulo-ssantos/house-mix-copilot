<template>
  <UModal
    v-model="isOpen"
    :ui="{ width: 'w-full max-w-[95vw] md:max-w-6xl lg:max-w-7xl' }"
  >
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3
            class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
          >
            <UIcon name="i-heroicons-cog-6-tooth" class="mr-2" />
            Settings
          </h3>
          <div class="flex items-center gap-2">
            <UBadge v-if="isDirty" color="orange" variant="soft" size="sm">
              Unsaved Changes
            </UBadge>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="closeModal"
            />
          </div>
        </div>
      </template>

      <UTabs :items="tabItems" class="w-full" variant="pill" size="sm">
        <!-- AI Settings Tab -->
        <template #ai="{ item }">
          <div class="space-y-6">
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="i-heroicons-cpu-chip" class="text-primary-500" />
              <h4 class="text-base font-medium">
                {{ item.label }} Configuration
              </h4>
              <UButton
                v-if="!aiTestResult?.success"
                color="primary"
                variant="soft"
                size="xs"
                :loading="testingAI"
                @click="testAIConnectionHandler"
              >
                Test Connection
              </UButton>
              <UBadge
                v-else-if="aiTestResult?.success"
                color="green"
                variant="soft"
                size="sm"
              >
                Connected
              </UBadge>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Connection Settings -->
              <div class="space-y-4">
                <h5
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Connection
                </h5>

                <UFormGroup
                  label="Ollama URL"
                  help="URL for your Ollama service"
                >
                  <UInput
                    v-model="localSettings.ai.ollamaUrl"
                    placeholder="http://localhost:11434"
                  />
                </UFormGroup>

                <UFormGroup
                  label="Primary Model"
                  help="Main AI model for analysis"
                >
                  <USelect
                    v-model="localSettings.ai.primaryModel"
                    :options="modelOptions"
                    placeholder="Select primary model"
                  />
                </UFormGroup>

                <UFormGroup
                  label="Fallback Model"
                  help="Backup model when primary fails"
                >
                  <USelect
                    v-model="localSettings.ai.fallbackModel"
                    :options="modelOptions"
                    placeholder="Select fallback model"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.ai.enableFallback"
                    label="Enable fallback strategy"
                    help="Automatically use fallback model if primary fails"
                  />
                </UFormGroup>
              </div>

              <!-- Model Parameters -->
              <div class="space-y-4">
                <h5
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Model Parameters
                </h5>

                <UFormGroup
                  label="Temperature"
                  help="Controls randomness (0.0-1.0)"
                >
                  <div class="flex items-center gap-3">
                    <URange
                      v-model="localSettings.ai.temperature"
                      :min="0"
                      :max="1"
                      :step="0.1"
                      class="flex-1"
                    />
                    <UInput
                      v-model.number="localSettings.ai.temperature"
                      type="number"
                      :min="0"
                      :max="1"
                      :step="0.1"
                      class="w-20"
                    />
                  </div>
                </UFormGroup>

                <UFormGroup label="Max Tokens" help="Maximum response length">
                  <UInput
                    v-model.number="localSettings.ai.maxTokens"
                    type="number"
                    :min="50"
                    :max="4096"
                    placeholder="2048"
                  />
                </UFormGroup>

                <UFormGroup
                  label="Language Optimization"
                  help="Optimize for specific language"
                >
                  <USelect
                    v-model="localSettings.ai.languageOptimization"
                    :options="languageOptions"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.ai.testConnectionOnSave"
                    label="Test connection when saving"
                    help="Automatically test AI connection when saving settings"
                  />
                </UFormGroup>
              </div>
            </div>

            <!-- System Prompt -->
            <UFormGroup
              label="System Prompt"
              help="Instructions that guide AI behavior"
            >
              <UTextarea
                v-model="localSettings.ai.systemPrompt"
                :rows="4"
                placeholder="Enter system instructions for the AI..."
              />
            </UFormGroup>

            <!-- Custom Prompts -->
            <UAccordion :items="promptAccordionItems" class="w-full">
              <template #liturgy-analysis="{ item }">
                <UTextarea
                  v-model="localSettings.ai.customPrompts.liturgyAnalysis"
                  :rows="6"
                  placeholder="Enter custom prompt for liturgy analysis..."
                />
              </template>

              <template #item-extraction="{ item }">
                <UTextarea
                  v-model="localSettings.ai.customPrompts.itemExtraction"
                  :rows="6"
                  placeholder="Enter custom prompt for item extraction..."
                />
              </template>

              <template #youtube-analysis="{ item }">
                <UTextarea
                  v-model="localSettings.ai.customPrompts.youtubeAnalysis"
                  :rows="6"
                  placeholder="Enter custom prompt for YouTube analysis..."
                />
              </template>
            </UAccordion>
          </div>
        </template>

        <!-- Database & Storage Tab -->
        <template #database="{ item }">
          <div class="space-y-6">
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="i-heroicons-circle-stack" class="text-blue-500" />
              <h4 class="text-base font-medium">
                {{ item.label }} Configuration
              </h4>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Database Settings -->
              <div class="space-y-4">
                <h5
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Database
                </h5>

                <UFormGroup
                  label="Database Path"
                  help="Path to SQLite database file"
                >
                  <UInput
                    v-model="localSettings.database.dbPath"
                    placeholder="./church-liturgy.db"
                  />
                </UFormGroup>

                <UFormGroup
                  label="Export Format"
                  help="Default format for data exports"
                >
                  <USelect
                    v-model="localSettings.database.exportFormat"
                    :options="exportFormatOptions"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.database.compressionEnabled"
                    label="Enable compression"
                    help="Compress database backups to save space"
                  />
                </UFormGroup>
              </div>

              <!-- Backup Settings -->
              <div class="space-y-4">
                <h5
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Backups
                </h5>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.database.backupEnabled"
                    label="Enable automatic backups"
                    help="Automatically backup database at regular intervals"
                  />
                </UFormGroup>

                <UFormGroup
                  v-if="localSettings.database.backupEnabled"
                  label="Backup Frequency"
                  help="How often to create backups"
                >
                  <USelect
                    v-model="localSettings.database.backupFrequency"
                    :options="backupFrequencyOptions"
                  />
                </UFormGroup>

                <UFormGroup
                  v-if="localSettings.database.backupEnabled"
                  label="Retention (Days)"
                  help="Keep backups for this many days"
                >
                  <UInput
                    v-model.number="localSettings.database.retentionDays"
                    type="number"
                    :min="1"
                    :max="365"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.database.autoCleanup"
                    label="Auto cleanup old data"
                    help="Automatically remove old backups and logs"
                  />
                </UFormGroup>
              </div>
            </div>
          </div>
        </template>

        <!-- YouTube Downloads Tab -->
        <template #youtube="{ item }">
          <div class="space-y-6">
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="i-heroicons-video-camera" class="text-red-500" />
              <h4 class="text-base font-medium">
                {{ item.label }} Configuration
              </h4>
              <UButton
                color="primary"
                variant="soft"
                size="xs"
                :loading="testingYouTube"
                @click="testYouTubeDownload"
              >
                Test Download
              </UButton>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Download Settings -->
              <div class="space-y-4">
                <h5
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Download Settings
                </h5>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.youtube.enabled"
                    label="Enable automatic YouTube downloads"
                    help="Automatically download YouTube videos found in liturgy text"
                  />
                </UFormGroup>

                <UFormGroup
                  label="Download Folder"
                  help="Folder where YouTube videos will be saved"
                >
                  <div class="flex gap-2">
                    <UInput
                      v-model="localSettings.youtube.downloadFolder"
                      class="flex-1"
                      placeholder="./downloads/youtube"
                    />
                    <UButton
                      color="gray"
                      variant="soft"
                      icon="i-heroicons-folder-open"
                      @click="selectDownloadFolder"
                    />
                  </div>
                </UFormGroup>

                <UFormGroup
                  label="Video Quality"
                  help="Preferred video quality for downloads"
                >
                  <USelect
                    v-model="localSettings.youtube.quality"
                    :options="videoQualityOptions"
                  />
                </UFormGroup>

                <UFormGroup
                  label="Filename Template"
                  help="Template for naming downloaded files"
                >
                  <UInput
                    v-model="localSettings.youtube.filenameTemplate"
                    placeholder="{title} ({date})"
                  />
                  <template #help>
                    <div class="text-xs text-gray-500 mt-1">
                      Variables: <code>{title}</code>, <code>{date}</code>,
                      <code>{videoId}</code>
                    </div>
                  </template>
                </UFormGroup>
              </div>

              <!-- Advanced Settings -->
              <div class="space-y-4">
                <h5
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Advanced Settings
                </h5>

                <UFormGroup
                  label="Max Concurrent Downloads"
                  help="Maximum number of simultaneous downloads"
                >
                  <UInput
                    v-model.number="
                      localSettings.youtube.maxConcurrentDownloads
                    "
                    type="number"
                    min="1"
                    max="5"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.youtube.skipExisting"
                    label="Skip existing files"
                    help="Don't re-download videos that already exist"
                  />
                </UFormGroup>

                <!-- Download History -->
                <div class="mt-6">
                  <h5
                    class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
                  >
                    Recent Downloads
                  </h5>
                  <div
                    v-if="youtubeHistory && youtubeHistory.length > 0"
                    class="space-y-2 max-h-48 overflow-y-auto"
                  >
                    <div
                      v-for="video in youtubeHistory.slice(0, 5)"
                      :key="video.id"
                      class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div class="flex-shrink-0">
                        <UIcon
                          :name="getDownloadStatusIcon(video.downloadStatus)"
                          :class="getDownloadStatusColor(video.downloadStatus)"
                        />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p
                          class="text-sm font-medium text-gray-900 dark:text-white truncate"
                        >
                          {{ video.title }}
                        </p>
                        <p class="text-xs text-gray-500 truncate">
                          {{ formatDate(video.createdAt) }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-500 text-center py-4">
                    No downloads yet
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Logging & Monitoring Tab -->
        <template #logging="{ item }">
          <div class="space-y-6">
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="i-heroicons-document-text" class="text-green-500" />
              <h4 class="text-base font-medium">
                {{ item.label }} Configuration
              </h4>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Log Settings -->
              <div class="space-y-4">
                <h5
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Log Settings
                </h5>

                <UFormGroup
                  label="Log Level"
                  help="Minimum level for log messages"
                >
                  <USelect
                    v-model="localSettings.logging.logLevel"
                    :options="logLevelOptions"
                  />
                </UFormGroup>

                <UFormGroup
                  label="Rotation Pattern"
                  help="How often to rotate log files"
                >
                  <USelect
                    v-model="localSettings.logging.rotationPattern"
                    :options="rotationPatternOptions"
                  />
                </UFormGroup>

                <UFormGroup
                  label="Retention (Months)"
                  help="Keep logs for this many months"
                >
                  <UInput
                    v-model.number="localSettings.logging.retentionMonths"
                    type="number"
                    :min="1"
                    :max="12"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.logging.enableConsoleColors"
                    label="Enable console colors"
                    help="Use colors in console log output"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.logging.enablePerformanceTracking"
                    label="Enable performance tracking"
                    help="Track and log performance metrics"
                  />
                </UFormGroup>
              </div>

              <!-- Log Categories -->
              <div class="space-y-4">
                <h5
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Log Categories
                </h5>

                <div class="space-y-3">
                  <UFormGroup
                    v-for="category in Object.keys(
                      localSettings.logging.categories
                    )"
                    :key="category"
                  >
                    <UCheckbox
                      v-model="localSettings.logging.categories[category as keyof typeof localSettings.logging.categories]"
                      :label="formatCategoryLabel(category)"
                      :help="getCategoryHelp(category)"
                    />
                  </UFormGroup>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Interface & Preferences Tab -->
        <template #interface="{ item }">
          <div class="space-y-6">
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="i-heroicons-paint-brush" class="text-purple-500" />
              <h4 class="text-base font-medium">
                {{ item.label }} Configuration
              </h4>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Appearance -->
              <div class="space-y-4">
                <h5
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Appearance
                </h5>

                <UFormGroup label="Theme" help="Color scheme preference">
                  <USelect
                    v-model="localSettings.interface.theme"
                    :options="themeOptions"
                  />
                </UFormGroup>

                <UFormGroup label="Language" help="Interface language">
                  <USelect
                    v-model="localSettings.interface.language"
                    :options="interfaceLanguageOptions"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.interface.compactMode"
                    label="Compact mode"
                    help="Reduce spacing and padding for smaller screens"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.interface.showTooltips"
                    label="Show tooltips"
                    help="Display helpful tooltips on interface elements"
                  />
                </UFormGroup>
              </div>

              <!-- Behavior -->
              <div class="space-y-4">
                <h5
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Behavior
                </h5>

                <UFormGroup
                  label="Default View"
                  help="Application to open on startup"
                >
                  <USelect
                    v-model="localSettings.interface.defaultView"
                    :options="defaultViewOptions"
                  />
                </UFormGroup>

                <UFormGroup
                  label="Auto-save Interval (seconds)"
                  help="Automatically save changes"
                >
                  <UInput
                    v-model.number="localSettings.interface.autoSaveInterval"
                    type="number"
                    :min="10"
                    :max="300"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.interface.showWelcomeOnStartup"
                    label="Show welcome screen"
                    help="Display welcome screen when starting the application"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.interface.enableKeyboardShortcuts"
                    label="Enable keyboard shortcuts"
                    help="Use keyboard shortcuts for common actions"
                  />
                </UFormGroup>
              </div>
            </div>
          </div>
        </template>

        <!-- Connection & Network Tab -->
        <template #network="{ item }">
          <div class="space-y-6">
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="i-heroicons-signal" class="text-indigo-500" />
              <h4 class="text-base font-medium">
                {{ item.label }} Configuration
              </h4>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Connection Settings -->
              <div class="space-y-4">
                <h5
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Connections
                </h5>

                <UFormGroup
                  label="Communication Port"
                  help="Port for inter-application communication"
                >
                  <UInput
                    v-model.number="localSettings.network.communicationPort"
                    type="number"
                    :min="3000"
                    :max="65535"
                  />
                </UFormGroup>

                <UFormGroup
                  label="Connection Timeout (seconds)"
                  help="Time to wait for connections"
                >
                  <UInput
                    v-model.number="localSettings.network.connectionTimeout"
                    type="number"
                    :min="5"
                    :max="60"
                  />
                </UFormGroup>

                <UFormGroup
                  label="Health Check Interval (seconds)"
                  help="How often to check service health"
                >
                  <UInput
                    v-model.number="localSettings.network.healthCheckInterval"
                    type="number"
                    :min="10"
                    :max="300"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.network.enableInterSpaceComm"
                    label="Enable inter-space communication"
                    help="Allow communication between different application spaces"
                  />
                </UFormGroup>
              </div>

              <!-- Retry & Recovery -->
              <div class="space-y-4">
                <h5
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Retry & Recovery
                </h5>

                <UFormGroup
                  label="Max Retries"
                  help="Maximum number of retry attempts"
                >
                  <UInput
                    v-model.number="localSettings.network.maxRetries"
                    type="number"
                    :min="0"
                    :max="10"
                  />
                </UFormGroup>

                <UFormGroup
                  label="Retry Delay (ms)"
                  help="Delay between retry attempts"
                >
                  <UInput
                    v-model.number="localSettings.network.retryDelay"
                    type="number"
                    :min="100"
                    :max="5000"
                  />
                </UFormGroup>

                <UFormGroup>
                  <UCheckbox
                    v-model="localSettings.network.offlineMode"
                    label="Offline mode"
                    help="Continue working when network services are unavailable"
                  />
                </UFormGroup>
              </div>
            </div>
          </div>
        </template>
      </UTabs>

      <template #footer>
        <div class="flex justify-between">
          <div class="flex gap-2">
            <UButton color="gray" variant="soft" @click="exportSettingsHandler">
              <UIcon name="i-heroicons-arrow-down-tray" class="mr-1" />
              Export
            </UButton>
            <UButton color="gray" variant="soft" @click="importSettingsHandler">
              <UIcon name="i-heroicons-arrow-up-tray" class="mr-1" />
              Import
            </UButton>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              style="display: none"
              @change="handleFileImport"
            />
          </div>

          <div class="flex gap-2">
            <UButton color="gray" variant="ghost" @click="resetToDefaults">
              Reset to Defaults
            </UButton>
            <UButton color="gray" variant="ghost" @click="closeModal">
              Cancel
            </UButton>
            <UButton
              color="primary"
              :loading="saving"
              @click="saveSettingsHandler"
            >
              Save Settings
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useSettings } from "~/composables/useSettings";
import { useLogger } from "~/composables/useLogger";

// Props
interface Props {
  modelValue: boolean;
}

// Tab item interface
interface TabItem {
  label: string;
  icon?: string;
  slot: string;
}

// Emits
interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Composables
const {
  settings,
  isLoaded,
  loadSettings,
  saveSettings,
  resetSettings,
  testAIConnection,
  exportSettings,
  importSettings,
  updateSettings,
} = useSettings();

const { userAction, system, error: logError } = useLogger();

// Toast - may not be available in all contexts
let toast: any = null;
try {
  toast = useToast();
} catch {
  // Toast not available, that's fine
}

// Helper function for safe toast notifications
const showToast = (options: any) => {
  if (toast) {
    toast.add(options);
  } else {
    console.log("Toast notification:", options.title, options.description);
  }
};

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const localSettings = ref(JSON.parse(JSON.stringify(settings.value)));
const saving = ref(false);
const testingAI = ref(false);
const aiTestResult = ref<{
  success: boolean;
  data?: any;
  error?: string;
} | null>(null);
const fileInput = ref<HTMLInputElement>();

// Local isDirty computed property that compares localSettings with global settings
const isDirty = computed(() => {
  return JSON.stringify(localSettings.value) !== JSON.stringify(settings.value);
});

// Tab configuration
const tabItems: TabItem[] = [
  {
    label: "AI Settings",
    icon: "i-heroicons-cpu-chip",
    slot: "ai",
  },
  {
    label: "Database & Storage",
    icon: "i-heroicons-circle-stack",
    slot: "database",
  },
  {
    label: "YouTube Downloads",
    icon: "i-heroicons-video-camera",
    slot: "youtube",
  },
  {
    label: "Logging & Monitoring",
    icon: "i-heroicons-document-text",
    slot: "logging",
  },
  {
    label: "Interface & Preferences",
    icon: "i-heroicons-paint-brush",
    slot: "interface",
  },
  {
    label: "Connection & Network",
    icon: "i-heroicons-signal",
    slot: "network",
  },
];

// Options for dropdowns
const modelOptions = ref([
  { label: "DeepSeek R1 1.5B (Fast)", value: "deepseek-r1:1.5b" },
  { label: "DeepSeek R1 7B (Capable)", value: "deepseek-r1:7b" },
  { label: "Llama 3.2 Latest", value: "llama3.2:latest" },
]);

// Load available models from Ollama
const loadOllamaModels = async () => {
  try {
    const response = await $fetch("/api/ollama/models");
    if (response.success && response.models.length > 0) {
      modelOptions.value = response.models;
    }
  } catch (error) {
    console.error("Failed to load Ollama models:", error);
    // Keep default models if API fails
  }
};

// Load models when component mounts
onMounted(() => {
  loadOllamaModels();
});

const languageOptions = [
  { label: "Portuguese (Optimized)", value: "portuguese" },
  { label: "English", value: "english" },
  { label: "Auto-detect", value: "auto" },
];

const exportFormatOptions = [
  { label: "JSON", value: "json" },
  { label: "CSV", value: "csv" },
  { label: "SQL", value: "sql" },
];

const backupFrequencyOptions = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const logLevelOptions = [
  { label: "Error", value: "error" },
  { label: "Warning", value: "warn" },
  { label: "Info", value: "info" },
  { label: "Debug", value: "debug" },
];

const rotationPatternOptions = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const themeOptions = [
  { label: "Auto (System)", value: "auto" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const interfaceLanguageOptions = [
  { label: "Português (Brasil)", value: "pt-BR" },
  { label: "English (US)", value: "en-US" },
];

const defaultViewOptions = [
  { label: "Main Space", value: "main-space" },
  { label: "Stream Space", value: "stream-space" },
  { label: "Unified Mode", value: "unified-mode" },
];

// YouTube-specific options
const videoQualityOptions = [
  { label: "Highest Available", value: "highest" },
  { label: "720p HD", value: "720p" },
  { label: "480p SD", value: "480p" },
  { label: "Audio Only", value: "audio" },
];

// YouTube-specific reactive data
const testingYouTube = ref(false);
const youtubeHistory = ref<any[]>([]);

// Accordion items for custom prompts
const promptAccordionItems = [
  {
    label: "Liturgy Analysis Prompt",
    description: "Custom prompt for general liturgy analysis",
    slot: "liturgy-analysis",
  },
  {
    label: "Item Extraction Prompt",
    description: "Custom prompt for extracting individual liturgy items",
    slot: "item-extraction",
  },
  {
    label: "YouTube Analysis Prompt",
    description: "Custom prompt for analyzing YouTube content",
    slot: "youtube-analysis",
  },
];

// Helper functions
const formatCategoryLabel = (category: string): string => {
  return category
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const getCategoryHelp = (category: string): string => {
  const helpTexts: Record<string, string> = {
    userAction: "Log user interactions and actions",
    aiAnalysis: "Log AI analysis requests and responses",
    liturgyOperation: "Log liturgy creation, editing, and management",
    performance: "Log performance metrics and timings",
    error: "Log errors and exceptions",
    security: "Log security-related events",
    system: "Log system startup, shutdown, and status changes",
  };
  return helpTexts[category] || "Enable logging for this category";
};

// Methods
const closeModal = () => {
  if (isDirty.value) {
    // Reset local settings if there are unsaved changes
    localSettings.value = JSON.parse(JSON.stringify(settings.value));
  }
  isOpen.value = false;
};

const saveSettingsHandler = async () => {
  saving.value = true;

  system("Settings save initiated", {
    hasChanges: isDirty.value,
    localSettings: localSettings.value,
  });

  try {
    // Log what's about to be saved
    userAction("Settings save started", {
      youtubeFolder: localSettings.value.youtube.downloadFolder,
      aiModel: localSettings.value.ai.primaryModel,
      isDirty: isDirty.value,
    });

    // Update global settings with local changes using the proper method
    updateSettings(localSettings.value);

    system("Settings merged to global state", {
      globalYoutubeFolder: settings.value.youtube.downloadFolder,
    });

    const result = await saveSettings();

    system("Save settings result", result);

    if (result.success) {
      userAction("Settings saved successfully", {
        youtubeFolder: settings.value.youtube.downloadFolder,
      });

      showToast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
        color: "green",
      });
      isOpen.value = false;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    logError(
      "Settings save failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        localSettings: localSettings.value,
        isDirty: isDirty.value,
      }
    );

    showToast({
      title: "Save Failed",
      description:
        error instanceof Error ? error.message : "Failed to save settings",
      color: "red",
    });
  } finally {
    saving.value = false;
  }
};

const testAIConnectionHandler = async () => {
  testingAI.value = true;
  try {
    aiTestResult.value = await testAIConnection();
    showToast({
      title: aiTestResult.value.success
        ? "Connection Successful"
        : "Connection Failed",
      description: aiTestResult.value.success
        ? "AI service is working correctly"
        : aiTestResult.value.error || "Failed to connect to AI service",
      color: aiTestResult.value.success ? "green" : "red",
    });
  } finally {
    testingAI.value = false;
  }
};

const resetToDefaults = () => {
  if (
    confirm(
      "Are you sure you want to reset all settings to defaults? This cannot be undone."
    )
  ) {
    resetSettings();
    localSettings.value = JSON.parse(JSON.stringify(settings.value));
    showToast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults.",
      color: "orange",
    });
  }
};

const exportSettingsHandler = () => {
  exportSettings();
  showToast({
    title: "Settings Exported",
    description: "Settings file has been downloaded.",
    color: "green",
  });
};

const importSettingsHandler = () => {
  fileInput.value?.click();
};

const handleFileImport = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const result = await importSettings(file);
  if (result.success) {
    localSettings.value = JSON.parse(JSON.stringify(settings.value));
    showToast({
      title: "Settings Imported",
      description: "Settings have been imported successfully.",
      color: "green",
    });
  } else {
    showToast({
      title: "Import Failed",
      description: result.error || "Failed to import settings",
      color: "red",
    });
  }

  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

// YouTube-specific methods
const testYouTubeDownload = async () => {
  testingYouTube.value = true;
  try {
    const response = await $fetch("/api/youtube/download", {
      method: "POST",
      body: {
        urls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"], // Test with a known video
        liturgyDate: new Date().toISOString().split("T")[0],
      },
    });

    showToast({
      title: response.results[0]?.success ? "Test Successful" : "Test Failed",
      description: response.results[0]?.success
        ? "YouTube download service is working correctly"
        : response.results[0]?.error || "Failed to test YouTube download",
      color: response.results[0]?.success ? "green" : "red",
    });
  } catch (error) {
    showToast({
      title: "Test Failed",
      description:
        error instanceof Error
          ? error.message
          : "Failed to test YouTube download",
      color: "red",
    });
  } finally {
    testingYouTube.value = false;
  }
};

const selectDownloadFolder = async () => {
  try {
    // Note: This would need Electron IPC for folder selection in desktop app
    // For now, let user type the path manually
    const folderPath = prompt(
      "Enter download folder path:",
      localSettings.value.youtube.downloadFolder
    );
    if (folderPath) {
      localSettings.value.youtube.downloadFolder = folderPath;
    }
  } catch (error) {
    console.error("Failed to select folder:", error);
  }
};

const fetchYouTubeHistory = async () => {
  try {
    const response = await $fetch("/api/youtube/download?limit=10");
    youtubeHistory.value = response.history || [];
  } catch (error) {
    console.error("Failed to fetch YouTube history:", error);
    youtubeHistory.value = [];
  }
};

const getDownloadStatusIcon = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "i-heroicons-check-circle";
    case "DOWNLOADING":
      return "i-heroicons-arrow-down-circle";
    case "FAILED":
      return "i-heroicons-x-circle";
    case "PENDING":
      return "i-heroicons-clock";
    default:
      return "i-heroicons-question-mark-circle";
  }
};

const getDownloadStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "text-green-500";
    case "DOWNLOADING":
      return "text-blue-500";
    case "FAILED":
      return "text-red-500";
    case "PENDING":
      return "text-yellow-500";
    default:
      return "text-gray-500";
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Watch for changes to detect if settings are dirty
watch(
  localSettings,
  () => {
    // Mark as dirty if local settings differ from saved settings
    // This is a simplified check - in a production app you might want more sophisticated comparison
  },
  { deep: true }
);

// Reset local settings when modal opens
watch(isOpen, (newValue) => {
  if (newValue) {
    localSettings.value = JSON.parse(JSON.stringify(settings.value));
    aiTestResult.value = null;
    fetchYouTubeHistory(); // Load YouTube history when modal opens
  }
});

// Load YouTube history on component mount
onMounted(() => {
  fetchYouTubeHistory();
});
</script>
