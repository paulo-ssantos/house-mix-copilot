import { ref, reactive, computed, watch, nextTick, readonly } from "vue";
import type { AIConfig } from "@church-copilot/shared";

// Import logger for settings operations
const logSettings = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  console.log(
    `%c${timestamp} [SETTINGS-${level.toUpperCase()}]: ${message}`,
    level === "error"
      ? "color: #ff4444; font-weight: bold;"
      : level === "warn"
      ? "color: #ffaa00; font-weight: bold;"
      : "color: #44ff44;",
    data
  );
};

// Settings Interface Definitions
export interface AISettings {
  ollamaUrl: string;
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  languageOptimization: "portuguese" | "english" | "auto";
  enableFallback: boolean;
  testConnectionOnSave: boolean;
  customPrompts: {
    liturgyAnalysis: string;
    itemExtraction: string;
    youtubeAnalysis: string;
  };
}

export interface DatabaseSettings {
  dbPath: string;
  backupEnabled: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
  autoCleanup: boolean;
  retentionDays: number;
  exportFormat: "json" | "csv" | "sql";
  compressionEnabled: boolean;
}

export interface LoggingSettings {
  logLevel: "error" | "warn" | "info" | "debug";
  rotationPattern: "daily" | "weekly" | "monthly";
  retentionMonths: number;
  enableConsoleColors: boolean;
  enablePerformanceTracking: boolean;
  categories: {
    userAction: boolean;
    aiAnalysis: boolean;
    liturgyOperation: boolean;
    performance: boolean;
    error: boolean;
    security: boolean;
    system: boolean;
  };
}

export interface InterfaceSettings {
  theme: "light" | "dark" | "auto";
  language: "pt-BR" | "en-US";
  defaultView: "main-space" | "stream-space" | "unified-mode";
  autoSaveInterval: number; // seconds
  showWelcomeOnStartup: boolean;
  enableKeyboardShortcuts: boolean;
  compactMode: boolean;
  showTooltips: boolean;
}

export interface NetworkSettings {
  communicationPort: number;
  connectionTimeout: number; // seconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  enableInterSpaceComm: boolean;
  healthCheckInterval: number; // seconds
  offlineMode: boolean;
}

export interface YouTubeSettings {
  enabled: boolean;
  downloadFolder: string;
  quality: "highest" | "720p" | "480p" | "audio";
  filenameTemplate: string;
  maxConcurrentDownloads: number;
  skipExisting: boolean;
}

export interface AppSettings {
  ai: AISettings;
  database: DatabaseSettings;
  youtube: YouTubeSettings;
  logging: LoggingSettings;
  interface: InterfaceSettings;
  network: NetworkSettings;
}

// Default Settings
const defaultSettings: AppSettings = {
  ai: {
    ollamaUrl: "http://localhost:11434",
    primaryModel: "deepseek-r1:1.5b",
    fallbackModel: "deepseek-r1:7b",
    temperature: 0.3,
    maxTokens: 2048,
    systemPrompt:
      "You are an expert church liturgy analyzer. Help structure and improve church service liturgies with focus on Portuguese language and Brazilian church traditions.",
    languageOptimization: "portuguese",
    enableFallback: true,
    testConnectionOnSave: false, // Disabled by default to prevent save hangs
    customPrompts: {
      liturgyAnalysis: `Analyze this church liturgy text and extract structured information:
1. Identify liturgy sections (Opening, Worship, Scripture, Sermon, etc.)
2. Extract music references and YouTube links
3. Identify timing estimates for each section
4. Note any special instructions or requirements
5. Preserve Portuguese language context and Brazilian church traditions

Format the response as structured JSON with clear categories.`,
      itemExtraction: `Extract individual liturgy items from this text:
1. Songs with titles, keys, and YouTube links
2. Scripture readings with references
3. Announcements and special instructions
4. Prayer segments and communion details
5. Offering and closing elements

Maintain Portuguese language accuracy and church terminology.`,
      youtubeAnalysis: `Analyze this YouTube URL for liturgy context:
1. Extract video title and duration
2. Identify if it's a worship song, sermon, or other content
3. Check for Portuguese language content
4. Assess suitability for church service
5. Extract any relevant metadata (key, tempo, style)`,
    },
  },
  database: {
    dbPath: "./church-liturgy.db",
    backupEnabled: true,
    backupFrequency: "weekly",
    autoCleanup: true,
    retentionDays: 90,
    exportFormat: "json",
    compressionEnabled: true,
  },
  youtube: {
    enabled: true,
    downloadFolder: "./downloads/youtube",
    quality: "highest",
    filenameTemplate: "{title} ({date})",
    maxConcurrentDownloads: 2,
    skipExisting: true,
  },
  logging: {
    logLevel: "info",
    rotationPattern: "monthly",
    retentionMonths: 3,
    enableConsoleColors: true,
    enablePerformanceTracking: true,
    categories: {
      userAction: true,
      aiAnalysis: true,
      liturgyOperation: true,
      performance: true,
      error: true,
      security: true,
      system: true,
    },
  },
  interface: {
    theme: "auto",
    language: "pt-BR",
    defaultView: "main-space",
    autoSaveInterval: 30,
    showWelcomeOnStartup: true,
    enableKeyboardShortcuts: true,
    compactMode: false,
    showTooltips: true,
  },
  network: {
    communicationPort: 3003,
    connectionTimeout: 10,
    maxRetries: 3,
    retryDelay: 1000,
    enableInterSpaceComm: true,
    healthCheckInterval: 30,
    offlineMode: false,
  },
};

// Global Settings State
const settings = ref<AppSettings>(JSON.parse(JSON.stringify(defaultSettings)));
const isLoaded = ref(false);
const isDirty = ref(false);

// Settings Composable
export function useSettings() {
  // Load settings from localStorage and database
  const loadSettings = async () => {
    try {
      const saved = localStorage.getItem("church-liturgy-settings");

      if (saved) {
        const parsedSettings = JSON.parse(saved);
        // Merge with defaults to handle new settings
        settings.value = {
          ...defaultSettings,
          ...parsedSettings,
          ai: { ...defaultSettings.ai, ...(parsedSettings.ai || {}) },
          database: {
            ...defaultSettings.database,
            ...(parsedSettings.database || {}),
          },
          youtube: {
            ...defaultSettings.youtube,
            ...(parsedSettings.youtube || {}),
          },
          logging: {
            ...defaultSettings.logging,
            ...(parsedSettings.logging || {}),
          },
          interface: {
            ...defaultSettings.interface,
            ...(parsedSettings.interface || {}),
          },
          network: {
            ...defaultSettings.network,
            ...(parsedSettings.network || {}),
          },
        };
      }

      // Also load YouTube configuration from database if available
      try {
        const response = await fetch("/api/youtube/config");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            settings.value.youtube = {
              ...settings.value.youtube,
              ...data.config,
            };
          }
        }
      } catch (error) {
        console.warn("Failed to load YouTube config from database:", error);
        // Continue with localStorage settings
      }

      isLoaded.value = true;
    } catch (error) {
      console.error("Failed to load settings:", error);
      settings.value = JSON.parse(JSON.stringify(defaultSettings));
      isLoaded.value = true;
    }
  };

  // Save settings to localStorage
  const saveSettings = async () => {
    logSettings("info", "Save settings initiated", {
      youtubeEnabled: settings.value.youtube.enabled,
      youtubeFolder: settings.value.youtube.downloadFolder,
      aiModel: settings.value.ai.primaryModel,
    });

    try {
      localStorage.setItem(
        "church-liturgy-settings",
        JSON.stringify(settings.value)
      );

      logSettings("info", "Settings saved to localStorage");

      // Save AI configuration to database via API for server-side usage
      if (settings.value.ai) {
        logSettings("info", "Saving AI configuration to database", {
          model: settings.value.ai.primaryModel,
          url: settings.value.ai.ollamaUrl,
        });

        try {
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

          const aiResponse = await fetch("/api/configuration", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              OLLAMA_MODEL: settings.value.ai.primaryModel,
              OLLAMA_URL: settings.value.ai.ollamaUrl,
              OLLAMA_TEMPERATURE: settings.value.ai.temperature.toString(),
              OLLAMA_MAX_TOKENS: settings.value.ai.maxTokens.toString(),
              OLLAMA_SYSTEM_PROMPT: settings.value.ai.systemPrompt,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!aiResponse.ok) {
            throw new Error(
              `AI config API returned ${aiResponse.status}: ${aiResponse.statusText}`
            );
          }

          const aiResult = await aiResponse.json();
          logSettings("info", "AI configuration saved to database", aiResult);
        } catch (aiError) {
          if (aiError instanceof Error && aiError.name === "AbortError") {
            logSettings("error", "AI configuration save timed out");
            console.warn("AI configuration save timed out after 15 seconds");
          } else {
            logSettings(
              "error",
              "Failed to save AI configuration to database",
              aiError
            );
            console.warn(
              "Failed to save AI configuration to database:",
              aiError
            );
          }
        }
      }

      // Save YouTube configuration to database via API
      if (settings.value.youtube) {
        logSettings("info", "Saving YouTube configuration to database", {
          folder: settings.value.youtube.downloadFolder,
          enabled: settings.value.youtube.enabled,
        });

        try {
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

          const youtubeResponse = await fetch("/api/youtube/config", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(settings.value.youtube),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!youtubeResponse.ok) {
            throw new Error(
              `YouTube config API returned ${youtubeResponse.status}: ${youtubeResponse.statusText}`
            );
          }

          const youtubeResult = await youtubeResponse.json();
          logSettings(
            "info",
            "YouTube configuration saved to database",
            youtubeResult
          );
        } catch (youtubeError) {
          if (
            youtubeError instanceof Error &&
            youtubeError.name === "AbortError"
          ) {
            logSettings("error", "YouTube configuration save timed out");
            console.warn(
              "YouTube configuration save timed out after 15 seconds"
            );
          } else {
            logSettings(
              "error",
              "Failed to save YouTube configuration",
              youtubeError
            );
            console.warn("Failed to save YouTube configuration:", youtubeError);
          }
          // Don't fail the entire save operation for YouTube config issues
        }
      }

      isDirty.value = false;

      // Test AI connection if enabled
      if (settings.value.ai.testConnectionOnSave) {
        try {
          logSettings("info", "Testing AI connection after save");
          await testAIConnection();
          logSettings("info", "AI connection test completed");
        } catch (testError) {
          logSettings("warn", "AI connection test failed", testError);
          // Don't fail the save operation if AI test fails
        }
      }

      logSettings("info", "Settings save completed successfully");
      return { success: true };
    } catch (error) {
      logSettings("error", "Settings save failed", error);
      console.error("Failed to save settings:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Reset to defaults
  const resetSettings = (category?: keyof AppSettings) => {
    if (category) {
      settings.value[category] = JSON.parse(
        JSON.stringify(defaultSettings[category])
      );
    } else {
      settings.value = JSON.parse(JSON.stringify(defaultSettings));
    }
    isDirty.value = true;
  };

  // Test AI Connection
  const testAIConnection = async () => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/health", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      return {
        success: data.services?.ai?.status === "connected",
        data: data.services?.ai,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          error: "Connection test timed out",
        };
      }
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Connection test failed",
      };
    }
  };

  // Export settings
  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings.value, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `church-liturgy-settings-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import settings
  const importSettings = (
    file: File
  ): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          settings.value = {
            ...defaultSettings,
            ...imported,
            ai: { ...defaultSettings.ai, ...(imported.ai || {}) },
            database: {
              ...defaultSettings.database,
              ...(imported.database || {}),
            },
            logging: {
              ...defaultSettings.logging,
              ...(imported.logging || {}),
            },
            interface: {
              ...defaultSettings.interface,
              ...(imported.interface || {}),
            },
            network: {
              ...defaultSettings.network,
              ...(imported.network || {}),
            },
          };
          isDirty.value = true;
          resolve({ success: true });
        } catch (error) {
          resolve({
            success: false,
            error:
              error instanceof Error ? error.message : "Invalid settings file",
          });
        }
      };
      reader.readAsText(file);
    });
  };

  // Get AI Config for services
  const getAIConfig = computed(
    (): AIConfig => ({
      ollamaUrl: settings.value.ai.ollamaUrl,
      model: settings.value.ai.primaryModel,
      temperature: settings.value.ai.temperature,
      maxTokens: settings.value.ai.maxTokens,
      systemPrompt: settings.value.ai.systemPrompt,
    })
  );

  // Watch for changes
  watch(
    settings,
    () => {
      if (isLoaded.value) {
        isDirty.value = true;
      }
    },
    { deep: true }
  );

  // Initialize on first use
  if (!isLoaded.value) {
    loadSettings();
  }

  // Update settings method for external updates
  const updateSettings = (newSettings: AppSettings) => {
    logSettings("info", "Updating settings state", {
      youtubeFolder: newSettings.youtube.downloadFolder,
      aiModel: newSettings.ai.primaryModel,
    });

    // Deep merge the new settings
    settings.value = {
      ...settings.value,
      ...newSettings,
      ai: { ...settings.value.ai, ...newSettings.ai },
      database: { ...settings.value.database, ...newSettings.database },
      youtube: { ...settings.value.youtube, ...newSettings.youtube },
      logging: { ...settings.value.logging, ...newSettings.logging },
      interface: { ...settings.value.interface, ...newSettings.interface },
      network: { ...settings.value.network, ...newSettings.network },
    };

    logSettings("info", "Settings state updated", {
      updatedYoutubeFolder: settings.value.youtube.downloadFolder,
      updatedAiModel: settings.value.ai.primaryModel,
    });
  };

  return {
    settings: readonly(settings),
    isLoaded: readonly(isLoaded),
    isDirty: readonly(isDirty),
    defaultSettings: readonly(ref(defaultSettings)),
    loadSettings,
    saveSettings,
    resetSettings,
    testAIConnection,
    exportSettings,
    importSettings,
    getAIConfig,
    updateSettings,
  };
}
