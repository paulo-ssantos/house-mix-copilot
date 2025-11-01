<template>
  <UModal v-model="isOpen" :ui="{ width: 'max-w-4xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">✏️ Edit Liturgy Item</h3>
          <UButton
            icon="i-heroicons-x-mark"
            size="sm"
            color="gray"
            variant="ghost"
            @click="closeModal"
          />
        </div>
      </template>

      <div v-if="editingItem" class="space-y-4">
        <!-- Title -->
        <UFormGroup label="Title" required>
          <UInput
            v-model="editingItem.title"
            placeholder="Enter item title"
            :ui="{ wrapper: 'relative' }"
          />
        </UFormGroup>

        <!-- Type -->
        <UFormGroup label="Type" required>
          <USelect
            v-model="editingItem.type"
            :options="liturgyItemTypes"
            option-attribute="label"
            value-attribute="value"
            :ui="{ wrapper: 'relative' }"
          />
        </UFormGroup>

        <!-- Description -->
        <UFormGroup label="Description">
          <UTextarea
            v-model="editingItem.description"
            placeholder="Enter item description (optional)"
            rows="3"
            :ui="{ wrapper: 'relative' }"
          />
        </UFormGroup>

        <!-- Time and Duration Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Start Time -->
          <UFormGroup label="Start Time">
            <UInput
              v-model="editingItem.startTime"
              placeholder="HH:mm"
              pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
              :ui="{ wrapper: 'relative' }"
            />
          </UFormGroup>

          <!-- Duration -->
          <UFormGroup label="Duration (minutes)">
            <UInput
              v-model.number="editingItem.duration"
              type="number"
              placeholder="0"
              min="0"
              :ui="{ wrapper: 'relative' }"
            />
          </UFormGroup>
        </div>

        <!-- Responsible and Music Key Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Responsible -->
          <UFormGroup label="Responsible Person">
            <UInput
              v-model="editingItem.responsible"
              placeholder="Who is responsible"
              :ui="{ wrapper: 'relative' }"
            />
          </UFormGroup>

          <!-- Music Key -->
          <UFormGroup label="Music Key">
            <UInput
              v-model="editingItem.musicKey"
              placeholder="e.g., G, Am, C#"
              :ui="{ wrapper: 'relative' }"
            />
          </UFormGroup>
        </div>

        <!-- YouTube URL -->
        <UFormGroup label="YouTube URL">
          <UInput
            v-model="editingItem.youtubeUrl"
            placeholder="https://www.youtube.com/watch?v=..."
            type="url"
            :ui="{ wrapper: 'relative' }"
          />
        </UFormGroup>

        <!-- Notes -->
        <UFormGroup label="Notes">
          <UTextarea
            v-model="editingItem.notes"
            placeholder="Additional notes (optional)"
            rows="3"
            :ui="{ wrapper: 'relative' }"
          />
        </UFormGroup>

        <!-- Completed Status -->
        <UFormGroup label="Status">
          <div class="flex items-center space-x-2">
            <UCheckbox v-model="editingItem.isCompleted" name="isCompleted" />
            <span class="text-sm">Mark as completed</span>
          </div>
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <UButton color="gray" variant="ghost" @click="closeModal">
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="saveChanges"
            :disabled="!isValid"
            :loading="isSaving"
          >
            Save Changes
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { LiturgyItem, LiturgyItemType } from "@church-copilot/shared";

// Props
interface Props {
  modelValue: boolean;
  item?: LiturgyItem | null;
}

// Emits
interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "save", item: LiturgyItem): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Reactive states
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const isSaving = ref(false);
const editingItem = ref<LiturgyItem | null>(null);

// Liturgy item type options
const liturgyItemTypes = [
  { value: "OPENING", label: "🚪 Opening (Abertura)" },
  { value: "PRAYER", label: "🙏 Prayer (Oração)" },
  { value: "MUSIC", label: "🎵 Music (Música)" },
  { value: "SPECIAL_MUSIC", label: "🎶 Special Music (Música Especial)" },
  { value: "READING", label: "📖 Reading (Leitura)" },
  { value: "MESSAGE", label: "💬 Message (Mensagem/Sermão)" },
  { value: "OFFERING", label: "💰 Offering (Ofertas/Dízimos)" },
  { value: "ANNOUNCEMENT", label: "📢 Announcement (Informativos)" },
  { value: "MOMENT", label: "✨ Special Moment (Momentos Especiais)" },
  { value: "CLOSING", label: "🔚 Closing (Encerramento)" },
  { value: "BREAK", label: "⏸️ Break (Intervalo)" },
  { value: "OTHER", label: "📋 Other (Outros)" },
] as const;

// Validation
const isValid = computed(() => {
  if (!editingItem.value) return false;
  return editingItem.value.title.trim().length > 0;
});

// Watch for item changes
watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      // Create a deep copy of the item for editing
      editingItem.value = {
        ...newItem,
        // Ensure all optional fields have proper defaults
        description: newItem.description || "",
        startTime: newItem.startTime || "",
        duration: newItem.duration || undefined,
        responsible: newItem.responsible || "",
        youtubeUrl: newItem.youtubeUrl || "",
        musicKey: newItem.musicKey || "",
        notes: newItem.notes || "",
      };
    } else {
      editingItem.value = null;
    }
  },
  { immediate: true }
);

// Methods
const closeModal = () => {
  isOpen.value = false;
  editingItem.value = null;
};

const saveChanges = async () => {
  if (!editingItem.value || !isValid.value) return;

  try {
    isSaving.value = true;

    // Clean up empty strings and undefined values
    const updatedItem: LiturgyItem = {
      ...editingItem.value,
      description: editingItem.value.description?.trim() || undefined,
      startTime: editingItem.value.startTime?.trim() || undefined,
      responsible: editingItem.value.responsible?.trim() || undefined,
      youtubeUrl: editingItem.value.youtubeUrl?.trim() || undefined,
      musicKey: editingItem.value.musicKey?.trim() || undefined,
      notes: editingItem.value.notes?.trim() || undefined,
      updatedAt: new Date(),
    };

    emit("save", updatedItem);
    closeModal();
  } catch (error) {
    console.error("Failed to save liturgy item:", error);
    // Handle error - you might want to show a toast notification
  } finally {
    isSaving.value = false;
  }
};

// Handle ESC key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen.value) {
      closeModal();
    }
  };

  document.addEventListener("keydown", handleEscape);

  onUnmounted(() => {
    document.removeEventListener("keydown", handleEscape);
  });
});
</script>
