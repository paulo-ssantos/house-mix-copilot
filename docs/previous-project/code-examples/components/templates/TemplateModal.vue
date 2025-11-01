<template>
  <UModal v-model="isOpen" :ui="{ width: 'max-w-6xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Liturgy Templates</h3>
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
        <!-- Template Categories -->
        <div class="flex space-x-4 border-b">
          <button
            v-for="category in templateCategories"
            :key="category.id"
            :class="[
              'pb-2 px-1 border-b-2 font-medium text-sm transition-colors',
              selectedCategory === category.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
            @click="selectedCategory = category.id"
          >
            {{ category.name }}
          </button>
        </div>

        <!-- Templates Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="template in filteredTemplates"
            :key="template.id"
            class="border rounded-lg p-4 hover:border-primary-500 cursor-pointer transition-colors"
            :class="{
              'border-primary-500 bg-primary-50 dark:bg-primary-950/50':
                selectedTemplate?.id === template.id,
            }"
            @click="selectTemplate(template)"
          >
            <div class="space-y-3">
              <div class="flex items-start justify-between">
                <h4 class="font-semibold text-sm">{{ template.name }}</h4>
                <UBadge :color="getCategoryColor(template.category)" size="xs">
                  {{ getCategoryName(template.category) }}
                </UBadge>
              </div>

              <p class="text-xs text-gray-600 dark:text-gray-400">
                {{ template.description }}
              </p>

              <div class="space-y-2">
                <div class="text-xs text-gray-500">
                  {{ template.items.length }} items • ~{{
                    template.estimatedDuration
                  }}
                  min
                </div>

                <!-- Preview of first few items -->
                <div class="space-y-1">
                  <div
                    v-for="item in template.items.slice(0, 3)"
                    :key="item.id"
                    class="flex items-center space-x-2 text-xs"
                  >
                    <UBadge
                      :color="getItemTypeColor(item.type)"
                      size="xs"
                      variant="soft"
                    >
                      {{ getItemTypeLabel(item.type) }}
                    </UBadge>
                    <span class="text-gray-600 dark:text-gray-400 truncate">
                      {{ item.title }}
                    </span>
                  </div>
                  <div
                    v-if="template.items.length > 3"
                    class="text-xs text-gray-400"
                  >
                    +{{ template.items.length - 3 }} more items...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Template Preview -->
        <div v-if="selectedTemplate" class="border-t pt-6">
          <h4 class="font-semibold mb-4">
            Preview: {{ selectedTemplate.name }}
          </h4>
          <div class="max-h-64 overflow-y-auto space-y-2">
            <div
              v-for="(item, index) in selectedTemplate.items"
              :key="item.id"
              class="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
            >
              <span class="w-8 text-center text-gray-500">{{ index + 1 }}</span>
              <UBadge
                :color="getItemTypeColor(item.type)"
                size="xs"
                variant="soft"
              >
                {{ getItemTypeLabel(item.type) }}
              </UBadge>
              <span class="flex-1 truncate">{{ item.title }}</span>
              <span v-if="item.duration" class="text-xs text-gray-500">
                {{ item.duration }}min
              </span>
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
            v-if="selectedTemplate"
            icon="i-heroicons-document-plus"
            @click="loadSelectedTemplate"
          >
            Load Template
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { LiturgyItem, LiturgyItemType } from "@church-copilot/shared";

interface LiturgyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number;
  items: LiturgyItem[];
  tags: string[];
  author?: string;
  isCustom?: boolean;
}

interface TemplateCategory {
  id: string;
  name: string;
  color: string;
}

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "template-loaded", template: LiturgyTemplate): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Reactive state
const isOpen = computed({
  get: () => {
    console.log("TemplateModal isOpen get:", props.modelValue);
    return props.modelValue;
  },
  set: (value) => {
    console.log("TemplateModal isOpen set:", value);
    emit("update:modelValue", value);
  },
});

const selectedCategory = ref("all");
const selectedTemplate = ref<LiturgyTemplate | null>(null);

// Template categories
const templateCategories: TemplateCategory[] = [
  { id: "all", name: "All Templates", color: "gray" },
  { id: "sunday", name: "Sunday Service", color: "blue" },
  { id: "special", name: "Special Events", color: "purple" },
  { id: "seasonal", name: "Seasonal", color: "green" },
  { id: "ceremony", name: "Ceremonies", color: "orange" },
  { id: "custom", name: "Custom", color: "gray" },
];

// Predefined templates
const templates: LiturgyTemplate[] = [
  {
    id: "sunday-traditional",
    name: "Traditional Sunday Service",
    description:
      "Classic Sunday worship service with hymns and traditional elements",
    category: "sunday",
    estimatedDuration: 75,
    tags: ["traditional", "hymns", "sunday"],
    items: [
      {
        id: "1",
        type: "OPENING",
        title: "Welcome & Call to Worship",
        description: "Welcome congregation and opening prayer",
        duration: 5,
        responsible: "Pastor",
        instructions: "Greet warmly, announce any special visitors",
        isCompleted: false,
      },
      {
        id: "2",
        type: "MUSIC",
        title: "Opening Hymn",
        description: "Congregation opening hymn",
        duration: 4,
        responsible: "Music Team",
        musicKey: "G",
        youtubeUrl: "https://www.youtube.com/watch?v=example",
        isCompleted: false,
      },
      {
        id: "3",
        type: "PRAYER",
        title: "Opening Prayer",
        description: "Prayer of invocation and thanksgiving",
        duration: 3,
        responsible: "Pastor",
        isCompleted: false,
      },
      {
        id: "4",
        type: "MUSIC",
        title: "Worship Songs",
        description: "Congregational worship and praise",
        duration: 15,
        responsible: "Music Team",
        musicKey: "C",
        isCompleted: false,
      },
      {
        id: "5",
        type: "READING",
        title: "Scripture Reading",
        description: "Reading from the Bible",
        duration: 5,
        responsible: "Reader",
        scriptureReference: "Psalm 23",
        isCompleted: false,
      },
      {
        id: "6",
        type: "MESSAGE",
        title: "Sermon",
        description: "Main teaching message",
        duration: 25,
        responsible: "Pastor",
        scriptureReference: "Psalm 23:1-6",
        isCompleted: false,
      },
      {
        id: "7",
        type: "OFFERING",
        title: "Offering",
        description: "Collection of tithes and offerings",
        duration: 8,
        responsible: "Deacons",
        isCompleted: false,
      },
      {
        id: "8",
        type: "PRAYER",
        title: "Closing Prayer",
        description: "Prayer of blessing and sending",
        duration: 3,
        responsible: "Pastor",
        isCompleted: false,
      },
      {
        id: "9",
        type: "CLOSING",
        title: "Benediction",
        description: "Final blessing and dismissal",
        duration: 2,
        responsible: "Pastor",
        isCompleted: false,
      },
    ],
  },
  {
    id: "modern-contemporary",
    name: "Modern Contemporary Service",
    description: "Contemporary worship with modern music and casual atmosphere",
    category: "sunday",
    estimatedDuration: 65,
    tags: ["contemporary", "modern", "casual"],
    items: [
      {
        id: "1",
        type: "OPENING",
        title: "Welcome & Connection",
        description: "Casual welcome and community connection time",
        duration: 5,
        responsible: "Worship Leader",
        isCompleted: false,
      },
      {
        id: "2",
        type: "MUSIC",
        title: "Worship Set - Opening",
        description: "Contemporary worship songs",
        duration: 12,
        responsible: "Worship Team",
        musicKey: "D",
        isCompleted: false,
      },
      {
        id: "3",
        type: "MOMENT",
        title: "Life Together",
        description: "Community announcements and sharing",
        duration: 5,
        responsible: "Community Pastor",
        isCompleted: false,
      },
      {
        id: "4",
        type: "MUSIC",
        title: "Worship Set - Continued",
        description: "More contemporary worship",
        duration: 10,
        responsible: "Worship Team",
        isCompleted: false,
      },
      {
        id: "5",
        type: "MESSAGE",
        title: "Teaching",
        description: "Biblical teaching in contemporary style",
        duration: 25,
        responsible: "Teaching Pastor",
        isCompleted: false,
      },
      {
        id: "6",
        type: "MUSIC",
        title: "Response Song",
        description: "Song of response and commitment",
        duration: 5,
        responsible: "Worship Team",
        isCompleted: false,
      },
      {
        id: "7",
        type: "CLOSING",
        title: "Blessing & Sending",
        description: "Final blessing and mission sending",
        duration: 3,
        responsible: "Pastor",
        isCompleted: false,
      },
    ],
  },
  {
    id: "christmas-service",
    name: "Christmas Eve Service",
    description:
      "Special Christmas Eve worship service with carols and candlelight",
    category: "seasonal",
    estimatedDuration: 60,
    tags: ["christmas", "candlelight", "carols"],
    items: [
      {
        id: "1",
        type: "OPENING",
        title: "Christmas Welcome",
        description: "Special Christmas greeting and opening",
        duration: 3,
        responsible: "Pastor",
        isCompleted: false,
      },
      {
        id: "2",
        type: "MUSIC",
        title: "O Come, All Ye Faithful",
        description: "Opening Christmas carol",
        duration: 4,
        responsible: "Choir",
        musicKey: "G",
        youtubeUrl: "https://www.youtube.com/watch?v=example",
        isCompleted: false,
      },
      {
        id: "3",
        type: "READING",
        title: "The Christmas Story",
        description: "Reading from Luke 2:1-20",
        duration: 8,
        responsible: "Reader",
        scriptureReference: "Luke 2:1-20",
        isCompleted: false,
      },
      {
        id: "4",
        type: "MUSIC",
        title: "Carol Medley",
        description: "Christmas carol selections",
        duration: 12,
        responsible: "Choir",
        isCompleted: false,
      },
      {
        id: "5",
        type: "MESSAGE",
        title: "The Light Has Come",
        description: "Christmas message about Jesus as the Light",
        duration: 15,
        responsible: "Pastor",
        scriptureReference: "John 1:1-14",
        isCompleted: false,
      },
      {
        id: "6",
        type: "MOMENT",
        title: "Candlelighting",
        description: "Special candlelight ceremony",
        duration: 10,
        responsible: "Pastor",
        instructions: "Light candles and sing Silent Night",
        isCompleted: false,
      },
      {
        id: "7",
        type: "MUSIC",
        title: "Silent Night",
        description: "Final carol by candlelight",
        duration: 5,
        responsible: "Congregation",
        musicKey: "C",
        isCompleted: false,
      },
      {
        id: "8",
        type: "CLOSING",
        title: "Christmas Blessing",
        description: "Special Christmas Eve blessing",
        duration: 3,
        responsible: "Pastor",
        isCompleted: false,
      },
    ],
  },
  {
    id: "wedding-ceremony",
    name: "Wedding Ceremony",
    description: "Traditional wedding ceremony template",
    category: "ceremony",
    estimatedDuration: 30,
    tags: ["wedding", "ceremony", "marriage"],
    items: [
      {
        id: "1",
        type: "OPENING",
        title: "Processional",
        description: "Bridal party entrance",
        duration: 5,
        responsible: "Music Director",
        instructions: "Coordinate with wedding coordinator",
        isCompleted: false,
      },
      {
        id: "2",
        type: "OPENING",
        title: "Welcome & Opening Prayer",
        description: "Welcome guests and opening prayer",
        duration: 3,
        responsible: "Officiant",
        isCompleted: false,
      },
      {
        id: "3",
        type: "READING",
        title: "Scripture Reading",
        description: "Reading about love and marriage",
        duration: 3,
        responsible: "Reader",
        scriptureReference: "1 Corinthians 13:4-8",
        isCompleted: false,
      },
      {
        id: "4",
        type: "MESSAGE",
        title: "Wedding Homily",
        description: "Brief message about marriage",
        duration: 5,
        responsible: "Officiant",
        isCompleted: false,
      },
      {
        id: "5",
        type: "MOMENT",
        title: "Vows",
        description: "Exchange of wedding vows",
        duration: 5,
        responsible: "Couple",
        isCompleted: false,
      },
      {
        id: "6",
        type: "MOMENT",
        title: "Ring Exchange",
        description: "Exchange of wedding rings",
        duration: 3,
        responsible: "Couple",
        isCompleted: false,
      },
      {
        id: "7",
        type: "PRAYER",
        title: "Unity Prayer",
        description: "Prayer of blessing over the marriage",
        duration: 3,
        responsible: "Officiant",
        isCompleted: false,
      },
      {
        id: "8",
        type: "CLOSING",
        title: "Pronouncement & Kiss",
        description: "Declaration of marriage and first kiss",
        duration: 2,
        responsible: "Officiant",
        isCompleted: false,
      },
      {
        id: "9",
        type: "CLOSING",
        title: "Recessional",
        description: "Bridal party exit",
        duration: 3,
        responsible: "Music Director",
        isCompleted: false,
      },
    ],
  },
];

// Computed
const filteredTemplates = computed(() => {
  if (selectedCategory.value === "all") {
    return templates;
  }
  return templates.filter((t) => t.category === selectedCategory.value);
});

// Methods
const closeModal = () => {
  isOpen.value = false;
  selectedTemplate.value = null;
  selectedCategory.value = "all";
};

const selectTemplate = (template: LiturgyTemplate) => {
  selectedTemplate.value = template;
};

const loadSelectedTemplate = () => {
  if (!selectedTemplate.value) return;

  emit("template-loaded", selectedTemplate.value);
  closeModal();
};

const getCategoryName = (categoryId: string): string => {
  return (
    templateCategories.find((c) => c.id === categoryId)?.name || categoryId
  );
};

const getCategoryColor = (categoryId: string): string => {
  const colors: Record<string, string> = {
    sunday: "blue",
    special: "purple",
    seasonal: "green",
    ceremony: "orange",
    custom: "gray",
  };
  return colors[categoryId] || "gray";
};

const getItemTypeLabel = (type: LiturgyItemType): string => {
  const labels = {
    OPENING: "Opening",
    PRAYER: "Prayer",
    MUSIC: "Music",
    SPECIAL_MUSIC: "Special Music",
    READING: "Reading",
    MESSAGE: "Message",
    OFFERING: "Offering",
    ANNOUNCEMENT: "Announcement",
    MOMENT: "Special Moment",
    CLOSING: "Closing",
    BREAK: "Break",
    OTHER: "Other",
  };
  return labels[type] || type;
};

const getItemTypeColor = (type: LiturgyItemType): string => {
  const colors = {
    OPENING: "blue",
    PRAYER: "purple",
    MUSIC: "green",
    SPECIAL_MUSIC: "emerald",
    READING: "indigo",
    MESSAGE: "orange",
    OFFERING: "yellow",
    ANNOUNCEMENT: "gray",
    MOMENT: "pink",
    CLOSING: "red",
    BREAK: "slate",
    OTHER: "neutral",
  };
  return colors[type] || "gray";
};
</script>
