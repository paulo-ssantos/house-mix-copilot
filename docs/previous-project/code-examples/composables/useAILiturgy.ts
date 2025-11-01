/**
 * useAILiturgy - Vue Composable for AI-Powered Liturgy Analysis
 *
 * Integrates Jina.ai services with Vue components for automated
 * Portuguese church liturgy program analysis and processing.
 *
 * Features:
 * - Automatic moment identification from raw text
 * - Portuguese church terminology optimization
 * - Real-time timing validation with visual indicators
 * - AI confidence scoring with manual override capabilities
 * - Integration with existing EditLiturgyItemModal patterns
 */

import { ref, computed, type Ref } from "vue";

// Type definitions
export interface LiturgyMoment {
  id?: number;
  title: string;
  type: string;
  description?: string;
  startTime?: string;
  duration?: number;
  responsible?: string;
  confidence: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AIAnalysisResult {
  moments: LiturgyMoment[];
  totalDuration?: number;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface TimelineEntry {
  id: string;
  title: string;
  startTime: string;
  duration: number;
  progress: number;
  status: "upcoming" | "current" | "completed" | "overdue";
  type: string;
}

export interface ResourceResult {
  id: string;
  title: string;
  url: string;
  type: "hymnal" | "bible" | "video" | "document" | "other";
  relevance: number;
  description?: string;
}

export interface VideoResult {
  id: string;
  title: string;
  url: string;
  platform: "youtube" | "vimeo" | "other";
  duration?: number;
  relevance: number;
  thumbnail?: string;
}

export interface AILiturgyState {
  isAnalyzing: boolean;
  isGeneratingTimeline: boolean;
  isFindingResources: boolean;
  isResearchingVideos: boolean;
  error: string | null;
  lastAnalysis: AIAnalysisResult | null;
  moments: LiturgyMoment[];
  timeline: TimelineEntry[];
  resources: ResourceResult[];
  videos: VideoResult[];
}

export interface TimingStatus {
  status: "on-time" | "late" | "early" | "upcoming" | "completed";
  offsetMinutes: number;
  message: string;
}

export interface TimingIndicator {
  color: string;
  icon: string;
  pulse: boolean;
  message: string;
  urgency: "low" | "medium" | "high";
}

export interface UseAILiturgyOptions {
  confidenceThreshold?: number;
  enableAutoResourceLookup?: boolean;
  enableAutoVideoResearch?: boolean;
  debugMode?: boolean;
}

export function useAILiturgy(options: UseAILiturgyOptions = {}) {
  // Configuration
  const config = {
    confidenceThreshold: options.confidenceThreshold || 0.05,
    enableAutoResourceLookup: options.enableAutoResourceLookup || false,
    enableAutoVideoResearch: options.enableAutoVideoResearch || false,
    debugMode: options.debugMode || false,
  };

  // Reactive State
  const state: Ref<AILiturgyState> = ref({
    isAnalyzing: false,
    isGeneratingTimeline: false,
    isFindingResources: false,
    isResearchingVideos: false,
    error: null,
    lastAnalysis: null,
    moments: [],
    timeline: [],
    resources: [],
    videos: [],
  });

  // Computed Properties
  const hasAnalysis = computed(() => state.value.lastAnalysis !== null);
  const hasMoments = computed(() => state.value.moments.length > 0);
  const hasTimeline = computed(() => state.value.timeline.length > 0);
  const isLoading = computed(
    () =>
      state.value.isAnalyzing ||
      state.value.isGeneratingTimeline ||
      state.value.isFindingResources ||
      state.value.isResearchingVideos
  );

  /**
   * Analyze Portuguese liturgy program text using AI
   */
  const analyzeLiturgyProgram = async (
    text: string
  ): Promise<AIAnalysisResult> => {
    state.value.isAnalyzing = true;
    state.value.error = null;

    try {
      if (config.debugMode) {
        console.log(
          "🤖 Starting AI liturgy analysis...",
          text.substring(0, 100)
        );
      }

      // Call server-side API endpoint
      const { data } = await $fetch("/api/ai/analyze-liturgy", {
        method: "POST",
        body: { text },
      });

      const analysis = data as AIAnalysisResult;

      state.value.lastAnalysis = analysis;
      state.value.moments = analysis.moments;

      if (config.debugMode) {
        console.log(
          `✅ Analysis complete: ${analysis.moments.length} moments found`
        );
      }

      // Auto-generate timeline if moments found
      if (analysis.moments.length > 0) {
        await generateTimeline(analysis.moments);
      }

      return analysis;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "AI analysis failed";
      state.value.error = errorMessage;
      console.error("❌ AI liturgy analysis error:", error);
      throw error;
    } finally {
      state.value.isAnalyzing = false;
    }
  };

  /**
   * Generate visual timeline with progress tracking
   * Implements user's timing indicator requirement
   */
  const generateTimeline = async (
    moments: LiturgyMoment[]
  ): Promise<TimelineEntry[]> => {
    state.value.isGeneratingTimeline = true;

    try {
      if (config.debugMode) {
        console.log("📅 Generating timeline for", moments.length, "moments");
      }

      const timeline: TimelineEntry[] = moments.map((moment, index) => {
        const startTime = moment.startTime || "19:00";
        const duration = moment.duration || 10;

        // Calculate status based on current time
        const currentTime = new Date();
        const momentTime = new Date();
        const [hours, minutes] = startTime.split(":").map(Number);
        momentTime.setHours(hours, minutes, 0, 0);

        let status: "upcoming" | "current" | "completed" | "overdue";
        let progress = 0;

        if (currentTime < momentTime) {
          status = "upcoming";
          progress = 0;
        } else if (
          currentTime.getTime() >
          momentTime.getTime() + duration * 60 * 1000
        ) {
          status = "completed";
          progress = 100;
        } else {
          status = "current";
          const elapsed =
            (currentTime.getTime() - momentTime.getTime()) / (1000 * 60);
          progress = Math.min((elapsed / duration) * 100, 100);

          if (progress > 100) {
            status = "overdue";
          }
        }

        return {
          id: `timeline-${moment.id || index}`,
          title: moment.title,
          startTime: moment.startTime || "19:00",
          duration: moment.duration || 10,
          progress,
          status,
          type: moment.type,
        };
      });

      state.value.timeline = timeline;

      if (config.debugMode) {
        console.log("✅ Timeline generated with", timeline.length, "entries");
      }

      return timeline;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Timeline generation failed";
      state.value.error = errorMessage;
      console.error("❌ Timeline generation error:", error);
      throw error;
    } finally {
      state.value.isGeneratingTimeline = false;
    }
  };

  /**
   * Find external resources for liturgy moment
   */
  const findResourcesForMoment = async (
    moment: LiturgyMoment
  ): Promise<ResourceResult[]> => {
    state.value.isFindingResources = true;

    try {
      if (config.debugMode) {
        console.log("🔍 Finding resources for:", moment.title);
      }

      // TODO: Implement server-side API endpoint for resource finding
      // For now, return empty array
      const resources: ResourceResult[] = [];

      state.value.resources = [...state.value.resources, ...resources];

      if (config.debugMode) {
        console.log(`✅ Found ${resources.length} resources`);
      }

      return resources;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Resource search failed";
      state.value.error = errorMessage;
      console.error("❌ Resource search error:", error);
      throw error;
    } finally {
      state.value.isFindingResources = false;
    }
  };

  /**
   * Research videos for liturgy moment
   */
  const researchVideosForMoment = async (
    moment: LiturgyMoment
  ): Promise<VideoResult[]> => {
    state.value.isResearchingVideos = true;

    try {
      if (config.debugMode) {
        console.log("🎥 Researching videos for:", moment.title);
      }

      // TODO: Implement server-side API endpoint for video research
      // For now, return empty array
      const videos: VideoResult[] = [];

      state.value.videos = [...state.value.videos, ...videos];

      if (config.debugMode) {
        console.log(`✅ Found ${videos.length} videos`);
      }

      return videos;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Video research failed";
      state.value.error = errorMessage;
      console.error("❌ Video research error:", error);
      throw error;
    } finally {
      state.value.isResearchingVideos = false;
    }
  };

  /**
   * Check timing status against current time
   * User's specific requirement: "Visual indicators for time late or in advance"
   */
  const checkTimingStatus = (
    moment: LiturgyMoment,
    currentTime: Date
  ): TimingStatus => {
    if (!moment.startTime) {
      return {
        status: "upcoming",
        offsetMinutes: 0,
        message: "Horário não definido",
      };
    }

    const [hours, minutes] = moment.startTime.split(":").map(Number);
    const momentTime = new Date();
    momentTime.setHours(hours, minutes, 0, 0);

    const diffMinutes = Math.round(
      (currentTime.getTime() - momentTime.getTime()) / (1000 * 60)
    );

    // Determine status based on timing
    let status: TimingStatus["status"];
    let message: string;

    if (diffMinutes < -5) {
      status = "upcoming";
      message = `Faltam ${Math.abs(diffMinutes)} minutos`;
    } else if (diffMinutes <= 2) {
      status = "on-time";
      message = "No horário";
    } else if (diffMinutes <= 5) {
      status = "late";
      message = `${diffMinutes} min atrasado`;
    } else {
      status = "late";
      message = `${diffMinutes} min atrasado`;
    }

    return {
      status,
      offsetMinutes: diffMinutes,
      message,
    };
  };

  /**
   * Get visual timing indicator
   * Implementation of user's timing indicator requirement
   */
  const getTimingIndicator = (status: TimingStatus): TimingIndicator => {
    switch (status.status) {
      case "upcoming":
        return {
          color: "#3B82F6", // blue
          icon: "⏳",
          pulse: false,
          message: status.message,
          urgency: "low",
        };

      case "on-time":
        return {
          color: "#10B981", // green
          icon: "✅",
          pulse: false,
          message: status.message,
          urgency: "low",
        };

      case "early":
        return {
          color: "#F59E0B", // amber
          icon: "⏰",
          pulse: true,
          message: status.message,
          urgency: "medium",
        };

      case "late":
        const urgency = Math.abs(status.offsetMinutes) > 5 ? "high" : "medium";
        return {
          color: urgency === "high" ? "#EF4444" : "#F59E0B", // red or amber
          icon: urgency === "high" ? "🚨" : "⚠️",
          pulse: true,
          message: status.message,
          urgency,
        };

      case "completed":
        return {
          color: "#6B7280", // gray
          icon: "✔️",
          pulse: false,
          message: "Concluído",
          urgency: "low",
        };

      default:
        return {
          color: "#6B7280",
          icon: "❓",
          pulse: false,
          message: "Status desconhecido",
          urgency: "low",
        };
    }
  };

  /**
   * Manual override for AI classification
   */
  const overrideAIClassification = (
    momentIndex: number,
    newType: string
  ): void => {
    if (state.value.moments[momentIndex]) {
      state.value.moments[momentIndex].type = newType;
      state.value.moments[momentIndex].confidence = 1.0; // Set to maximum confidence for manual override

      if (config.debugMode) {
        console.log(`🎯 Manual override: moment ${momentIndex} → ${newType}`);
      }
    }
  };

  /**
   * Adjust AI confidence threshold
   */
  const adjustConfidenceThreshold = (threshold: number): void => {
    config.confidenceThreshold = Math.max(0.01, Math.min(1.0, threshold));

    if (config.debugMode) {
      console.log(
        `🎛️ Confidence threshold adjusted to: ${config.confidenceThreshold}`
      );
    }
  };

  /**
   * Validate liturgy moment structure
   */
  const validateMoment = (moment: LiturgyMoment): boolean => {
    return !!(
      moment.title?.trim() &&
      moment.type?.trim() &&
      moment.confidence >= config.confidenceThreshold
    );
  };

  /**
   * Clear current analysis
   */
  const clearAnalysis = (): void => {
    state.value.lastAnalysis = null;
    state.value.moments = [];
    state.value.timeline = [];
    state.value.resources = [];
    state.value.videos = [];
    state.value.error = null;

    if (config.debugMode) {
      console.log("🧹 Analysis cleared");
    }
  };

  /**
   * Reset entire state
   */
  const resetState = (): void => {
    state.value.isAnalyzing = false;
    state.value.isGeneratingTimeline = false;
    state.value.isFindingResources = false;
    state.value.isResearchingVideos = false;
    clearAnalysis();

    if (config.debugMode) {
      console.log("🔄 State reset");
    }
  };

  // Return reactive state and actions
  return {
    // State
    ...state.value,

    // Computed
    hasAnalysis,
    hasMoments,
    hasTimeline,
    isLoading,

    // Actions
    analyzeLiturgyProgram,
    generateTimeline,
    findResourcesForMoment,
    researchVideosForMoment,
    checkTimingStatus,
    getTimingIndicator,
    overrideAIClassification,
    adjustConfidenceThreshold,
    validateMoment,
    clearAnalysis,
    resetState,

    // Configuration
    config,
  };
}
