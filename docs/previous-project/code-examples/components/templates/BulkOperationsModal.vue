<template>
  <UModal v-model="isOpen" :ui="{ width: 'max-w-6xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Bulk Operations</h3>
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
        <!-- Operation Selection -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <UButton
            :variant="operation === 'delete' ? 'solid' : 'outline'"
            :color="operation === 'delete' ? 'red' : 'gray'"
            icon="i-heroicons-trash"
            size="sm"
            @click="operation = 'delete'"
          >
            Delete
          </UButton>
          <UButton
            :variant="operation === 'duplicate' ? 'solid' : 'outline'"
            :color="operation === 'duplicate' ? 'blue' : 'gray'"
            icon="i-heroicons-document-duplicate"
            size="sm"
            @click="operation = 'duplicate'"
          >
            Duplicate
          </UButton>
          <UButton
            :variant="operation === 'move' ? 'solid' : 'outline'"
            :color="operation === 'move' ? 'green' : 'gray'"
            icon="i-heroicons-arrows-up-down"
            size="sm"
            @click="operation = 'move'"
          >
            Move
          </UButton>
          <UButton
            :variant="operation === 'edit' ? 'solid' : 'outline'"
            :color="operation === 'edit' ? 'purple' : 'gray'"
            icon="i-heroicons-pencil-square"
            size="sm"
            @click="operation = 'edit'"
          >
            Edit
          </UButton>
        </div>

        <!-- Item Selection -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="font-semibold">Select Items</h4>
            <div class="space-x-2">
              <UButton size="xs" variant="ghost" @click="selectAll">
                Select All
              </UButton>
              <UButton size="xs" variant="ghost" @click="clearSelection">
                Clear
              </UButton>
              <UButton size="xs" variant="ghost" @click="invertSelection">
                Invert
              </UButton>
            </div>
          </div>

          <!-- Filter Options -->
          <div class="flex space-x-4">
            <USelect
              v-model="typeFilter"
              :options="typeFilterOptions"
              placeholder="Filter by type"
            />
            <USelect
              v-model="completionFilter"
              :options="completionFilterOptions"
              placeholder="Filter by completion"
            />
          </div>

          <!-- Items List -->
          <div class="border rounded-lg max-h-80 overflow-y-auto">
            <div
              v-for="(item, index) in filteredItems"
              :key="item.id"
              class="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800"
              :class="{
                'bg-blue-50 dark:bg-blue-950/50': selectedItems.has(item.id),
              }"
            >
              <UCheckbox
                :model-value="selectedItems.has(item.id)"
                @update:model-value="toggleItemSelection(item.id)"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2">
                  <UBadge size="xs" variant="soft">{{ item.type }}</UBadge>
                  <span class="truncate font-medium">{{ item.title }}</span>
                  <UBadge
                    v-if="item.isCompleted"
                    size="xs"
                    color="green"
                    variant="soft"
                  >
                    ✓
                  </UBadge>
                </div>
                <p
                  v-if="item.description"
                  class="text-sm text-gray-500 truncate mt-1"
                >
                  {{ item.description }}
                </p>
              </div>
              <div class="text-sm text-gray-400">
                #{{ originalItems.findIndex((i) => i.id === item.id) + 1 }}
              </div>
            </div>

            <div
              v-if="filteredItems.length === 0"
              class="p-8 text-center text-gray-500"
            >
              No items match the current filters
            </div>
          </div>

          <div class="text-sm text-gray-500">
            {{ selectedItems.size }} of {{ filteredItems.length }} items
            selected
          </div>
        </div>

        <!-- Operation-specific Options -->
        <div v-if="selectedItems.size > 0" class="space-y-4 border-t pt-4">
          <!-- Delete Options -->
          <div v-if="operation === 'delete'" class="space-y-3">
            <h5 class="font-medium text-red-700 dark:text-red-300">
              Delete Selected Items
            </h5>
            <UAlert
              color="red"
              variant="soft"
              icon="i-heroicons-exclamation-triangle"
              title="Warning"
              :description="`This will permanently delete ${selectedItems.size} items. This action cannot be undone.`"
            />
          </div>

          <!-- Duplicate Options -->
          <div v-if="operation === 'duplicate'" class="space-y-3">
            <h5 class="font-medium text-blue-700 dark:text-blue-300">
              Duplicate Selected Items
            </h5>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2"
                  >Duplicate Position</label
                >
                <USelect
                  v-model="duplicatePosition"
                  :options="duplicatePositionOptions"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2"
                  >Naming Convention</label
                >
                <USelect
                  v-model="duplicateNaming"
                  :options="duplicateNamingOptions"
                />
              </div>
            </div>
          </div>

          <!-- Move Options -->
          <div v-if="operation === 'move'" class="space-y-3">
            <h5 class="font-medium text-green-700 dark:text-green-300">
              Move Selected Items
            </h5>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Move To</label>
                <USelect
                  v-model="movePosition"
                  :options="movePositionOptions"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2"
                  >Maintain Order</label
                >
                <UToggle
                  v-model="maintainOrder"
                  :ui="{ container: 'flex items-center space-x-2' }"
                >
                  <span class="text-sm">Keep relative positioning</span>
                </UToggle>
              </div>
            </div>
          </div>

          <!-- Edit Options -->
          <div v-if="operation === 'edit'" class="space-y-3">
            <h5 class="font-medium text-purple-700 dark:text-purple-300">
              Edit Selected Items
            </h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2"
                  >Change Type</label
                >
                <USelect
                  v-model="editType"
                  :options="editTypeOptions"
                  placeholder="Keep current types"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2"
                  >Mark as Completed</label
                >
                <USelect
                  v-model="editCompleted"
                  :options="editCompletedOptions"
                  placeholder="Keep current status"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2"
                >Add Prefix to Titles</label
              >
              <UInput
                v-model="editTitlePrefix"
                placeholder="Enter prefix (optional)"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2"
                >Add Suffix to Titles</label
              >
              <UInput
                v-model="editTitleSuffix"
                placeholder="Enter suffix (optional)"
              />
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div
          v-if="selectedItems.size > 0 && previewChanges.length > 0"
          class="space-y-3 border-t pt-4"
        >
          <h5 class="font-medium">Preview Changes</h5>
          <div
            class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-40 overflow-y-auto"
          >
            <div
              v-for="change in previewChanges.slice(0, 10)"
              :key="change.id"
              class="text-sm py-1"
            >
              <span class="font-medium">{{ change.action }}:</span>
              <span class="text-gray-600 dark:text-gray-400 ml-2">{{
                change.description
              }}</span>
            </div>
            <div
              v-if="previewChanges.length > 10"
              class="text-xs text-gray-500 mt-2"
            >
              +{{ previewChanges.length - 10 }} more changes...
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <UButton variant="ghost" color="gray" @click="closeModal">
            Cancel
          </UButton>
          <UButton
            :disabled="selectedItems.size === 0"
            :color="operation === 'delete' ? 'red' : 'primary'"
            :icon="getOperationIcon(operation)"
            @click="performOperation"
          >
            {{ getOperationLabel(operation) }} {{ selectedItems.size }} Items
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { LiturgyItem } from "@church-copilot/shared";

interface Props {
  modelValue: boolean;
  liturgyItems: LiturgyItem[];
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "operation-completed", operation: string, items: LiturgyItem[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Reactive state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const operation = ref<"delete" | "duplicate" | "move" | "edit">("delete");
const selectedItems = ref(new Set<string>());
const typeFilter = ref("");
const completionFilter = ref("");

// Duplicate options
const duplicatePosition = ref("after");
const duplicateNaming = ref("copy");

// Move options
const movePosition = ref("beginning");
const maintainOrder = ref(true);

// Edit options
const editType = ref("");
const editCompleted = ref("");
const editTitlePrefix = ref("");
const editTitleSuffix = ref("");

// Computed
const originalItems = computed(() => props.liturgyItems);

const filteredItems = computed(() => {
  let items = originalItems.value;

  if (typeFilter.value) {
    items = items.filter((item) => item.type === typeFilter.value);
  }

  if (completionFilter.value === "completed") {
    items = items.filter((item) => item.isCompleted);
  } else if (completionFilter.value === "incomplete") {
    items = items.filter((item) => !item.isCompleted);
  }

  return items;
});

const typeFilterOptions = computed(() => [
  { label: "All Types", value: "" },
  ...Array.from(new Set(originalItems.value.map((item) => item.type))).map(
    (type) => ({ label: type, value: type })
  ),
]);

const completionFilterOptions = [
  { label: "All Items", value: "" },
  { label: "Completed", value: "completed" },
  { label: "Incomplete", value: "incomplete" },
];

const duplicatePositionOptions = [
  { label: "After original", value: "after" },
  { label: "Before original", value: "before" },
  { label: "At end", value: "end" },
  { label: "At beginning", value: "beginning" },
];

const duplicateNamingOptions = [
  { label: 'Add "Copy"', value: "copy" },
  { label: 'Add "(2)"', value: "number" },
  { label: "Add timestamp", value: "timestamp" },
  { label: "Keep original", value: "original" },
];

const movePositionOptions = [
  { label: "To beginning", value: "beginning" },
  { label: "To end", value: "end" },
  { label: "After specific item", value: "after" },
  { label: "Before specific item", value: "before" },
];

const editTypeOptions = computed(() => [
  { label: "Keep current", value: "" },
  ...Array.from(new Set(originalItems.value.map((item) => item.type))).map(
    (type) => ({ label: type, value: type })
  ),
]);

const editCompletedOptions = [
  { label: "Keep current", value: "" },
  { label: "Mark completed", value: "completed" },
  { label: "Mark incomplete", value: "incomplete" },
];

const previewChanges = computed(() => {
  const changes: Array<{ id: string; action: string; description: string }> =
    [];
  const selectedItemsArray = Array.from(selectedItems.value);

  if (selectedItemsArray.length === 0) return changes;

  switch (operation.value) {
    case "delete":
      selectedItemsArray.forEach((itemId) => {
        const item = originalItems.value.find((i) => i.id === itemId);
        if (item) {
          changes.push({
            id: itemId,
            action: "Delete",
            description: `"${item.title}" (${item.type})`,
          });
        }
      });
      break;

    case "duplicate":
      selectedItemsArray.forEach((itemId) => {
        const item = originalItems.value.find((i) => i.id === itemId);
        if (item) {
          let newTitle = item.title;
          switch (duplicateNaming.value) {
            case "copy":
              newTitle = `${item.title} (Copy)`;
              break;
            case "number":
              newTitle = `${item.title} (2)`;
              break;
            case "timestamp":
              newTitle = `${item.title} (${new Date().toLocaleTimeString()})`;
              break;
          }
          changes.push({
            id: itemId,
            action: "Duplicate",
            description: `"${item.title}" → "${newTitle}"`,
          });
        }
      });
      break;

    case "move":
      changes.push({
        id: "move",
        action: "Move",
        description: `${selectedItemsArray.length} items to ${movePosition.value}`,
      });
      break;

    case "edit":
      selectedItemsArray.forEach((itemId) => {
        const item = originalItems.value.find((i) => i.id === itemId);
        if (item) {
          const changes_list = [];

          if (editType.value && editType.value !== item.type) {
            changes_list.push(`type: ${item.type} → ${editType.value}`);
          }

          if (editCompleted.value) {
            const newCompleted = editCompleted.value === "completed";
            if (newCompleted !== item.isCompleted) {
              changes_list.push(
                `completed: ${item.isCompleted} → ${newCompleted}`
              );
            }
          }

          let newTitle = item.title;
          if (editTitlePrefix.value) {
            newTitle = `${editTitlePrefix.value}${newTitle}`;
          }
          if (editTitleSuffix.value) {
            newTitle = `${newTitle}${editTitleSuffix.value}`;
          }
          if (newTitle !== item.title) {
            changes_list.push(`title: "${item.title}" → "${newTitle}"`);
          }

          if (changes_list.length > 0) {
            changes.push({
              id: itemId,
              action: "Edit",
              description: `"${item.title}": ${changes_list.join(", ")}`,
            });
          }
        }
      });
      break;
  }

  return changes;
});

// Methods
const closeModal = () => {
  isOpen.value = false;
  resetModal();
};

const resetModal = () => {
  operation.value = "delete";
  selectedItems.value.clear();
  typeFilter.value = "";
  completionFilter.value = "";
  duplicatePosition.value = "after";
  duplicateNaming.value = "copy";
  movePosition.value = "beginning";
  maintainOrder.value = true;
  editType.value = "";
  editCompleted.value = "";
  editTitlePrefix.value = "";
  editTitleSuffix.value = "";
};

const selectAll = () => {
  filteredItems.value.forEach((item) => selectedItems.value.add(item.id));
};

const clearSelection = () => {
  selectedItems.value.clear();
};

const invertSelection = () => {
  const newSelection = new Set<string>();
  filteredItems.value.forEach((item) => {
    if (!selectedItems.value.has(item.id)) {
      newSelection.add(item.id);
    }
  });
  selectedItems.value = newSelection;
};

const toggleItemSelection = (itemId: string) => {
  if (selectedItems.value.has(itemId)) {
    selectedItems.value.delete(itemId);
  } else {
    selectedItems.value.add(itemId);
  }
};

const getOperationIcon = (op: string) => {
  switch (op) {
    case "delete":
      return "i-heroicons-trash";
    case "duplicate":
      return "i-heroicons-document-duplicate";
    case "move":
      return "i-heroicons-arrows-up-down";
    case "edit":
      return "i-heroicons-pencil-square";
    default:
      return "i-heroicons-cog-6-tooth";
  }
};

const getOperationLabel = (op: string) => {
  switch (op) {
    case "delete":
      return "Delete";
    case "duplicate":
      return "Duplicate";
    case "move":
      return "Move";
    case "edit":
      return "Edit";
    default:
      return "Process";
  }
};

const performOperation = () => {
  const selectedItemsArray = Array.from(selectedItems.value);
  if (selectedItemsArray.length === 0) return;

  let updatedItems = [...originalItems.value];

  switch (operation.value) {
    case "delete":
      updatedItems = updatedItems.filter(
        (item) => !selectedItems.value.has(item.id)
      );
      break;

    case "duplicate":
      const duplicates: LiturgyItem[] = [];
      selectedItemsArray.forEach((itemId) => {
        const item = originalItems.value.find((i) => i.id === itemId);
        if (item) {
          let newTitle = item.title;
          switch (duplicateNaming.value) {
            case "copy":
              newTitle = `${item.title} (Copy)`;
              break;
            case "number":
              newTitle = `${item.title} (2)`;
              break;
            case "timestamp":
              newTitle = `${item.title} (${new Date().toLocaleTimeString()})`;
              break;
          }

          const duplicate: LiturgyItem = {
            ...item,
            id: `${item.id}-copy-${Date.now()}`,
            title: newTitle,
            isCompleted: false,
          };

          duplicates.push(duplicate);
        }
      });

      // Insert duplicates based on position
      switch (duplicatePosition.value) {
        case "beginning":
          updatedItems = [...duplicates, ...updatedItems];
          break;
        case "end":
          updatedItems = [...updatedItems, ...duplicates];
          break;
        case "after":
        case "before":
          // Insert after/before each original item
          const newItems: LiturgyItem[] = [];
          updatedItems.forEach((item) => {
            if (
              duplicatePosition.value === "before" &&
              selectedItems.value.has(item.id)
            ) {
              const duplicate = duplicates.find((d) =>
                d.id.startsWith(item.id)
              );
              if (duplicate) newItems.push(duplicate);
            }
            newItems.push(item);
            if (
              duplicatePosition.value === "after" &&
              selectedItems.value.has(item.id)
            ) {
              const duplicate = duplicates.find((d) =>
                d.id.startsWith(item.id)
              );
              if (duplicate) newItems.push(duplicate);
            }
          });
          updatedItems = newItems;
          break;
      }
      break;

    case "move":
      const itemsToMove = updatedItems.filter((item) =>
        selectedItems.value.has(item.id)
      );
      const itemsToKeep = updatedItems.filter(
        (item) => !selectedItems.value.has(item.id)
      );

      switch (movePosition.value) {
        case "beginning":
          updatedItems = [...itemsToMove, ...itemsToKeep];
          break;
        case "end":
          updatedItems = [...itemsToKeep, ...itemsToMove];
          break;
        // TODO: Implement 'after' and 'before' specific item
      }
      break;

    case "edit":
      updatedItems = updatedItems.map((item) => {
        if (!selectedItems.value.has(item.id)) return item;

        const updatedItem = { ...item };

        if (editType.value) {
          updatedItem.type = editType.value;
        }

        if (editCompleted.value) {
          updatedItem.isCompleted = editCompleted.value === "completed";
        }

        if (editTitlePrefix.value || editTitleSuffix.value) {
          let newTitle = item.title;
          if (editTitlePrefix.value) {
            newTitle = `${editTitlePrefix.value}${newTitle}`;
          }
          if (editTitleSuffix.value) {
            newTitle = `${newTitle}${editTitleSuffix.value}`;
          }
          updatedItem.title = newTitle;
        }

        return updatedItem;
      });
      break;
  }

  emit("operation-completed", operation.value, updatedItems);
  closeModal();
};
</script>
