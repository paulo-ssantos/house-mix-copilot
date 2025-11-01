<template>
  <UModal v-model="isOpen" :ui="{ width: 'max-w-2xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Import / Export Liturgy</h3>
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
        <!-- Mode Selection -->
        <div class="flex space-x-4">
          <UButton
            :variant="mode === 'export' ? 'solid' : 'outline'"
            :color="mode === 'export' ? 'primary' : 'gray'"
            icon="i-heroicons-arrow-down-tray"
            @click="mode = 'export'"
          >
            Export
          </UButton>
          <UButton
            :variant="mode === 'import' ? 'solid' : 'outline'"
            :color="mode === 'import' ? 'primary' : 'gray'"
            icon="i-heroicons-arrow-up-tray"
            @click="mode = 'import'"
          >
            Import
          </UButton>
        </div>

        <!-- Export Mode -->
        <div v-if="mode === 'export'" class="space-y-4">
          <div>
            <h4 class="font-semibold mb-2">Export Current Liturgy</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Export your current liturgy as a JSON file that can be imported
              later or shared with others.
            </p>

            <div class="space-y-3">
              <!-- Export Options -->
              <div class="space-y-2">
                <UCheckbox
                  v-model="exportOptions.includeMetadata"
                  label="Include metadata (title, date, church, elders)"
                />
                <UCheckbox
                  v-model="exportOptions.includeCompletionStatus"
                  label="Include completion status"
                />
                <UCheckbox
                  v-model="exportOptions.includeTimestamps"
                  label="Include timestamps and timing data"
                />
              </div>

              <!-- Export Format -->
              <div>
                <label class="block text-sm font-medium mb-2"
                  >Export Format</label
                >
                <USelect
                  v-model="exportFormat"
                  :options="exportFormatOptions"
                />
              </div>
            </div>
          </div>

          <!-- Export Preview -->
          <div v-if="exportData" class="border rounded-lg">
            <div
              class="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b rounded-t-lg"
            >
              <h5 class="font-medium text-sm">Export Preview</h5>
            </div>
            <div class="p-4">
              <pre
                class="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-40"
                >{{ exportPreview }}</pre
              >
            </div>
          </div>
        </div>

        <!-- Import Mode -->
        <div v-if="mode === 'import'" class="space-y-4">
          <div>
            <h4 class="font-semibold mb-2">Import Liturgy</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Import a liturgy from a JSON file. This will replace your current
              liturgy.
            </p>
          </div>

          <!-- File Upload -->
          <div
            class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              class="hidden"
              @change="handleFileSelect"
            />

            <div class="space-y-4">
              <div class="text-4xl">📁</div>
              <div>
                <h5 class="font-medium">
                  Drop a JSON file here, or click to browse
                </h5>
                <p class="text-sm text-gray-500 mt-1">
                  Supports JSON files exported from this application
                </p>
              </div>
              <UButton
                icon="i-heroicons-document-plus"
                @click="triggerFileSelect"
              >
                Choose File
              </UButton>
            </div>
          </div>

          <!-- File Info -->
          <div
            v-if="selectedFile"
            class="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div class="flex items-center space-x-3">
              <div class="text-blue-600">📄</div>
              <div>
                <h6 class="font-medium">{{ selectedFile.name }}</h6>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ formatFileSize(selectedFile.size) }} •
                  {{ formatFileDate(selectedFile.lastModified) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Import Preview -->
          <div v-if="importData" class="space-y-4">
            <div
              class="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4"
            >
              <h5 class="font-medium text-green-800 dark:text-green-200">
                Import Preview
              </h5>
              <div class="mt-2 space-y-1 text-sm">
                <p>
                  <strong>Title:</strong> {{ importData.title || "Untitled" }}
                </p>
                <p><strong>Date:</strong> {{ importData.date || "No date" }}</p>
                <p>
                  <strong>Items:</strong>
                  {{ importData.items?.length || 0 }} liturgy items
                </p>
              </div>
            </div>

            <!-- Items Preview -->
            <div class="border rounded-lg">
              <div
                class="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b rounded-t-lg"
              >
                <h6 class="font-medium text-sm">Liturgy Items Preview</h6>
              </div>
              <div class="p-4 max-h-40 overflow-y-auto">
                <div
                  v-for="(item, index) in importData.items?.slice(0, 5)"
                  :key="index"
                  class="flex items-center space-x-2 text-sm py-1"
                >
                  <span class="w-6 text-center text-gray-500">{{
                    index + 1
                  }}</span>
                  <UBadge size="xs" variant="soft">{{ item.type }}</UBadge>
                  <span class="truncate">{{ item.title }}</span>
                </div>
                <div
                  v-if="importData.items && importData.items.length > 5"
                  class="text-xs text-gray-500 mt-2"
                >
                  +{{ importData.items.length - 5 }} more items...
                </div>
              </div>
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
          <div class="space-x-2">
            <UButton
              v-if="mode === 'export'"
              icon="i-heroicons-arrow-down-tray"
              :disabled="!hasDataToExport"
              @click="performExport"
            >
              Export
            </UButton>
            <UButton
              v-if="mode === 'import'"
              icon="i-heroicons-arrow-up-tray"
              :disabled="!importData"
              @click="performImport"
            >
              Import
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { LiturgyItem } from "@church-copilot/shared";

interface LiturgyData {
  title: string;
  date: string;
  church: string;
  elders: string;
  items: LiturgyItem[];
  metadata?: {
    exportedAt: string;
    version: string;
    source: string;
  };
}

interface Props {
  modelValue: boolean;
  liturgyForm: {
    title: string;
    date: string;
    church: string;
    elders: string;
    rawText: string;
  };
  liturgyItems: LiturgyItem[];
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "import-completed", data: LiturgyData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Reactive state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const mode = ref<"import" | "export">("export");
const selectedFile = ref<File | null>(null);
const importData = ref<LiturgyData | null>(null);
const exportData = ref<LiturgyData | null>(null);
const error = ref<string | null>(null);
const fileInput = ref<HTMLInputElement>();

// Export options
const exportOptions = ref({
  includeMetadata: true,
  includeCompletionStatus: false,
  includeTimestamps: false,
});

const exportFormat = ref("json");
const exportFormatOptions = [
  { label: "JSON (Recommended)", value: "json" },
  { label: "JSON (Compact)", value: "json-compact" },
];

// Computed
const hasDataToExport = computed(() => {
  return props.liturgyItems.length > 0 || props.liturgyForm.title.trim();
});

const exportPreview = computed(() => {
  if (!exportData.value) return "";

  if (exportFormat.value === "json-compact") {
    return JSON.stringify(exportData.value);
  }
  return JSON.stringify(exportData.value, null, 2);
});

// Watchers
watch(
  () => [props.liturgyForm, props.liturgyItems, exportOptions.value],
  () => generateExportData(),
  { deep: true }
);

watch(isOpen, (newValue) => {
  if (newValue) {
    generateExportData();
  }
});

// Methods
const closeModal = () => {
  isOpen.value = false;
  resetModal();
};

const resetModal = () => {
  mode.value = "export";
  selectedFile.value = null;
  importData.value = null;
  exportData.value = null;
  error.value = null;
  exportOptions.value = {
    includeMetadata: true,
    includeCompletionStatus: false,
    includeTimestamps: false,
  };
};

const generateExportData = () => {
  if (!hasDataToExport.value) {
    exportData.value = null;
    return;
  }

  const data: LiturgyData = {
    title: props.liturgyForm.title,
    date: props.liturgyForm.date,
    church: props.liturgyForm.church,
    elders: props.liturgyForm.elders,
    items: props.liturgyItems.map((item) => {
      const exportItem = { ...item };

      if (!exportOptions.value.includeCompletionStatus) {
        delete exportItem.isCompleted;
      }

      if (!exportOptions.value.includeTimestamps) {
        delete exportItem.startTime;
        delete exportItem.endTime;
      }

      return exportItem;
    }),
  };

  if (exportOptions.value.includeMetadata) {
    data.metadata = {
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
      source: "Church Liturgy Copilot",
    };
  }

  exportData.value = data;
};

const performExport = () => {
  if (!exportData.value) return;

  const filename = `liturgy-${
    props.liturgyForm.title.toLowerCase().replace(/\s+/g, "-") || "untitled"
  }-${new Date().toISOString().split("T")[0]}.json`;
  const content =
    exportFormat.value === "json-compact"
      ? JSON.stringify(exportData.value)
      : JSON.stringify(exportData.value, null, 2);

  // Create and download file
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  closeModal();
};

const triggerFileSelect = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  selectedFile.value = file;
  error.value = null;

  if (file.type !== "application/json" && !file.name.endsWith(".json")) {
    error.value = "Please select a valid JSON file";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const data = JSON.parse(content);

      // Validate the data structure
      if (!validateImportData(data)) {
        error.value =
          "Invalid file format. Please select a valid liturgy export file.";
        return;
      }

      importData.value = data;
    } catch (err) {
      error.value = "Failed to parse JSON file. Please check the file format.";
    }
  };

  reader.readAsText(file);
};

const validateImportData = (data: any): data is LiturgyData => {
  if (typeof data !== "object" || !data) return false;

  // Check for required fields
  if (typeof data.title !== "string" && typeof data.date !== "string")
    return false;

  // Check items array
  if (!Array.isArray(data.items)) return false;

  // Validate each item has required fields
  return data.items.every(
    (item: any) =>
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.type === "string"
  );
};

const performImport = () => {
  if (!importData.value) return;

  emit("import-completed", importData.value);
  closeModal();
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatFileDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};
</script>
