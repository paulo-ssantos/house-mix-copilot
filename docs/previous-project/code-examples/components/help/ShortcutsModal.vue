<template>
  <UModal v-model="isOpen" :ui="{ width: 'max-w-3xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">⌨️ Keyboard Shortcuts</h3>
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
        <!-- General Shortcuts -->
        <div>
          <h4 class="font-semibold text-blue-600 dark:text-blue-400 mb-3">
            🔧 General
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>Show Help</span>
              <UKbd>F1</UKbd>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>Save Liturgy</span>
              <div class="flex space-x-1">
                <UKbd>Ctrl</UKbd>
                <span class="text-gray-400">+</span>
                <UKbd>S</UKbd>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature Access Shortcuts -->
        <div>
          <h4 class="font-semibold text-green-600 dark:text-green-400 mb-3">
            🚀 Features
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>Load Template</span>
              <div class="flex space-x-1">
                <UKbd>Ctrl</UKbd>
                <span class="text-gray-400">+</span>
                <UKbd>T</UKbd>
              </div>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>Load Template (Alt)</span>
              <UKbd>F2</UKbd>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>Import/Export</span>
              <div class="flex space-x-1">
                <UKbd>Ctrl</UKbd>
                <span class="text-gray-400">+</span>
                <UKbd>I</UKbd>
              </div>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>Import/Export (Alt)</span>
              <UKbd>F3</UKbd>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>Bulk Operations</span>
              <div class="flex space-x-1">
                <UKbd>Ctrl</UKbd>
                <span class="text-gray-400">+</span>
                <UKbd>B</UKbd>
              </div>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>Bulk Operations (Alt)</span>
              <UKbd>F4</UKbd>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>YouTube Integration</span>
              <div class="flex space-x-1">
                <UKbd>Ctrl</UKbd>
                <span class="text-gray-400">+</span>
                <UKbd>Y</UKbd>
              </div>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>Quick Import</span>
              <div class="flex space-x-1">
                <UKbd>Ctrl</UKbd>
                <span class="text-gray-400">+</span>
                <UKbd>O</UKbd>
              </div>
            </div>
          </div>
        </div>

        <!-- Liturgy Control Shortcuts -->
        <div>
          <h4 class="font-semibold text-purple-600 dark:text-purple-400 mb-3">
            ⏱️ Liturgy Control
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>Play/Pause</span>
              <UKbd>Space</UKbd>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>Previous Item</span>
              <div class="flex space-x-1">
                <UKbd>Shift</UKbd>
                <span class="text-gray-400">+</span>
                <UKbd>↑</UKbd>
              </div>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <span>Next Item</span>
              <div class="flex space-x-1">
                <UKbd>Shift</UKbd>
                <span class="text-gray-400">+</span>
                <UKbd>↓</UKbd>
              </div>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div
          class="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <h5 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            💡 Tips
          </h5>
          <ul class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Shortcuts work only when not typing in input fields</li>
            <li>
              • Use <code>Space</code> to quickly pause/resume during liturgy
            </li>
            <li>
              • Use <code>Shift + Arrow keys</code> to navigate items during
              liturgy
            </li>
            <li>
              • Function keys (F1-F4) provide alternative access to main
              features
            </li>
            <li>
              • <code>Ctrl/Cmd</code> shortcuts follow standard conventions
            </li>
          </ul>
        </div>

        <!-- Platform Note -->
        <div class="text-xs text-gray-500 text-center">
          <span v-if="isMac"
            >Use <strong>Cmd</strong> instead of <strong>Ctrl</strong> on
            Mac</span
          >
          <span v-else
            >Use <strong>Ctrl</strong> for shortcuts on Windows/Linux</span
          >
        </div>
      </div>

      <template #footer>
        <div class="flex justify-center">
          <UButton color="gray" @click="closeModal"> Got it! </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Reactive state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Detect platform for keyboard shortcuts display
const isMac = computed(() => {
  return (
    typeof navigator !== "undefined" &&
    navigator.platform.toLowerCase().includes("mac")
  );
});

// Methods
const closeModal = () => {
  isOpen.value = false;
};
</script>
