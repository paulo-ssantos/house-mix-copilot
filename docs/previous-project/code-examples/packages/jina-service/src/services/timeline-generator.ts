import { LiturgyMoment } from "../types/jina.types.js";

/**
 * TimelineGenerator - Smart timeline processing for liturgy moments
 *
 * Processes liturgy moments to create visual timelines with progress tracking
 * and timing optimization for Brazilian church sound/projection teams.
 */
export class TimelineGenerator {
  /**
   * Generate timeline data from liturgy moments
   */
  generateTimeline(moments: LiturgyMoment[]): TimelineData {
    console.log(
      `[TimelineGenerator] Generating timeline for ${moments.length} moments`
    );

    // Ensure moments have proper timing
    const processedMoments = this.processTimingData(moments);

    // Create timeline entries
    const entries = this.createTimelineEntries(processedMoments);

    // Calculate timeline metrics
    const metrics = this.calculateTimelineMetrics(processedMoments);

    return {
      entries,
      metrics,
      totalDuration: metrics.totalDuration,
      estimatedEndTime: metrics.estimatedEndTime,
    };
  }

  /**
   * Process and validate timing data for all moments
   */
  private processTimingData(
    moments: LiturgyMoment[]
  ): ProcessedLiturgyMoment[] {
    const processed: ProcessedLiturgyMoment[] = [];
    let currentTime = this.parseServiceStartTime();

    for (let i = 0; i < moments.length; i++) {
      const moment = moments[i];

      // Parse or calculate start time
      let startTime = currentTime;
      if (moment.startTime) {
        const parsedTime = this.parseTime(moment.startTime);
        if (parsedTime) {
          startTime = parsedTime;
          currentTime = new Date(parsedTime);
        }
      }

      // Ensure duration exists
      const duration =
        moment.duration || this.getDefaultDuration(moment.type || "");

      // Calculate end time
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      const processedMoment: ProcessedLiturgyMoment = {
        ...moment,
        startTime: this.formatTime(startTime),
        duration,
        endTime: this.formatTime(endTime),
        order: i + 1,
        isActive: false,
        isCompleted: false,
        timelinePosition: 0, // Will be calculated in createTimelineEntries
        statusIndicator: this.getStatusIndicator(moment),
        timingAlert: this.checkTimingAlert(moment, duration),
      };

      processed.push(processedMoment);

      // Set next current time
      currentTime = new Date(endTime.getTime() + 2 * 60 * 1000); // 2 minute buffer
    }

    return processed;
  }

  /**
   * Create timeline entries with visual positioning
   */
  private createTimelineEntries(
    moments: ProcessedLiturgyMoment[]
  ): TimelineEntry[] {
    return moments.map((moment, index) => ({
      id: moment.id || `entry_${index}`,
      title: moment.title,
      subtitle: moment.type || "",
      responsible: moment.responsible || "A definir",
      startTime: moment.startTime!,
      endTime: moment.endTime!,
      duration: moment.duration!,
      order: moment.order,
      position: {
        left: this.calculateHorizontalPosition(moment.startTime!, moments),
        width: this.calculateWidth(moment.duration!, moments),
        top: index * 60 + 10, // 60px per row with 10px margin
      },
      status: moment.isCompleted
        ? "completed"
        : moment.isActive
        ? "active"
        : "pending",
      color: this.getColorByType(moment.type || ""),
      icon: this.getIconByType(moment.type || ""),
      description: moment.description || "",
      timingIndicator: {
        isOnTime: !moment.timingAlert,
        isLate: moment.timingAlert === "late",
        isEarly: moment.timingAlert === "early",
        message: this.getTimingMessage(moment.timingAlert),
      },
    }));
  }

  /**
   * Calculate timeline metrics and statistics
   */
  private calculateTimelineMetrics(
    moments: ProcessedLiturgyMoment[]
  ): TimelineMetrics {
    if (moments.length === 0) {
      return {
        totalDuration: 0,
        totalMoments: 0,
        estimatedEndTime: new Date().toTimeString().substring(0, 5),
        averageDuration: 0,
        longestMoment: null,
        shortestMoment: null,
      };
    }

    const totalDuration = moments.reduce(
      (sum, moment) => sum + (moment.duration || 0),
      0
    );
    const lastMoment = moments[moments.length - 1];
    const estimatedEndTime = lastMoment.endTime || "20:00";

    const durations = moments.map((m) => m.duration || 0);
    const averageDuration = totalDuration / moments.length;

    const longestMoment = moments.reduce((longest, current) =>
      (current.duration || 0) > (longest.duration || 0) ? current : longest
    );

    const shortestMoment = moments.reduce((shortest, current) =>
      (current.duration || 0) < (shortest.duration || 0) ? current : shortest
    );

    return {
      totalDuration,
      totalMoments: moments.length,
      estimatedEndTime,
      averageDuration: Math.round(averageDuration),
      longestMoment: {
        title: longestMoment.title,
        duration: longestMoment.duration || 0,
      },
      shortestMoment: {
        title: shortestMoment.title,
        duration: shortestMoment.duration || 0,
      },
    };
  }

  /**
   * Parse service start time (default 19:00)
   */
  private parseServiceStartTime(): Date {
    const now = new Date();
    now.setHours(19, 0, 0, 0); // Default 7 PM start
    return now;
  }

  /**
   * Parse time string to Date object
   */
  private parseTime(timeStr: string): Date | null {
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    return null;
  }

  /**
   * Format Date object to time string (HH:MM)
   */
  private formatTime(date: Date): string {
    return date.toTimeString().substring(0, 5);
  }

  /**
   * Get default duration for moment type
   */
  private getDefaultDuration(type: string): number {
    const durationMap: Record<string, number> = {
      Oração: 3,
      Cântico: 4,
      Louvor: 5,
      "Leitura Bíblica": 5,
      Pregação: 30,
      Comunhão: 15,
      Ofertório: 8,
      Anúncios: 5,
      Bênção: 2,
      Adoração: 10,
      Testemunho: 8,
      "Momento Musical": 6,
      Intercessão: 10,
      Reflexão: 5,
      Convite: 10,
      Despedida: 2,
    };
    return durationMap[type] || 5;
  }

  /**
   * Calculate horizontal position in timeline (percentage)
   */
  private calculateHorizontalPosition(
    startTime: string,
    allMoments: ProcessedLiturgyMoment[]
  ): number {
    if (allMoments.length === 0) return 0;

    const firstMoment = allMoments[0];
    const lastMoment = allMoments[allMoments.length - 1];

    const startMinutes = this.timeToMinutes(startTime);
    const firstMinutes = this.timeToMinutes(firstMoment.startTime!);
    const lastMinutes = this.timeToMinutes(lastMoment.endTime!);

    const totalSpan = lastMinutes - firstMinutes;
    const position = ((startMinutes - firstMinutes) / totalSpan) * 100;

    return Math.max(0, Math.min(100, position));
  }

  /**
   * Calculate width in timeline (percentage)
   */
  private calculateWidth(
    duration: number,
    allMoments: ProcessedLiturgyMoment[]
  ): number {
    if (allMoments.length === 0) return 10;

    const totalDuration = allMoments.reduce(
      (sum, m) => sum + (m.duration || 0),
      0
    );
    const width = (duration / totalDuration) * 100;

    return Math.max(2, Math.min(50, width)); // Min 2%, max 50%
  }

  /**
   * Convert time string to minutes since start of day
   */
  private timeToMinutes(timeStr: string): number {
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
  }

  /**
   * Get color for moment type
   */
  private getColorByType(type: string): string {
    const colorMap: Record<string, string> = {
      Oração: "#4F46E5", // Indigo
      Cântico: "#10B981", // Emerald
      Louvor: "#F59E0B", // Amber
      "Leitura Bíblica": "#6366F1", // Violet
      Pregação: "#DC2626", // Red
      Comunhão: "#7C3AED", // Purple
      Ofertório: "#059669", // Emerald-700
      Anúncios: "#6B7280", // Gray
      Bênção: "#8B5CF6", // Violet-500
      Adoração: "#F97316", // Orange
      Testemunho: "#06B6D4", // Cyan
      "Momento Musical": "#84CC16", // Lime
      Intercessão: "#3B82F6", // Blue
      Reflexão: "#64748B", // Slate
      Convite: "#EF4444", // Red-500
      Despedida: "#22C55E", // Green
    };
    return colorMap[type] || "#6B7280";
  }

  /**
   * Get icon for moment type
   */
  private getIconByType(type: string): string {
    const iconMap: Record<string, string> = {
      Oração: "🙏",
      Cântico: "🎵",
      Louvor: "🎶",
      "Leitura Bíblica": "📖",
      Pregação: "🎤",
      Comunhão: "🍷",
      Ofertório: "💰",
      Anúncios: "📢",
      Bênção: "✨",
      Adoração: "🙌",
      Testemunho: "💬",
      "Momento Musical": "🎹",
      Intercessão: "🕊️",
      Reflexão: "💭",
      Convite: "✋",
      Despedida: "👋",
    };
    return iconMap[type] || "📋";
  }

  /**
   * Get status indicator for moment
   */
  private getStatusIndicator(moment: LiturgyMoment): StatusIndicator {
    return {
      type: "pending",
      color: "#6B7280",
      message: "Aguardando",
    };
  }

  /**
   * Check for timing alerts
   */
  private checkTimingAlert(
    moment: LiturgyMoment,
    duration: number
  ): TimingAlert | undefined {
    // This would be enhanced with real-time checking during service
    // For now, return undefined (no alerts)
    return undefined;
  }

  /**
   * Get timing message based on alert type
   */
  private getTimingMessage(alert: TimingAlert | undefined): string {
    if (!alert) return "No horário";

    switch (alert) {
      case "late":
        return "Atrasado";
      case "early":
        return "Adiantado";
      case "overrunning":
        return "Passando do tempo";
      default:
        return "No horário";
    }
  }

  /**
   * Update timeline with current progress (for live tracking)
   */
  updateProgress(
    timelineData: TimelineData,
    currentTime: string
  ): TimelineData {
    const currentMinutes = this.timeToMinutes(currentTime);

    const updatedEntries = timelineData.entries.map((entry) => {
      const startMinutes = this.timeToMinutes(entry.startTime);
      const endMinutes = this.timeToMinutes(entry.endTime);

      let status: "pending" | "active" | "completed" = "pending";
      let timingIndicator = { ...entry.timingIndicator };

      if (currentMinutes >= endMinutes) {
        status = "completed";
      } else if (currentMinutes >= startMinutes) {
        status = "active";
        // Check if running late
        const expectedEndTime = startMinutes + entry.duration;
        if (currentMinutes > expectedEndTime) {
          timingIndicator = {
            isOnTime: false,
            isLate: true,
            isEarly: false,
            message: "Passando do tempo",
          };
        }
      }

      return {
        ...entry,
        status,
        timingIndicator,
      };
    });

    return {
      ...timelineData,
      entries: updatedEntries,
    };
  }
}

// Types for timeline generation
interface ProcessedLiturgyMoment extends LiturgyMoment {
  endTime?: string;
  order: number;
  isActive: boolean;
  isCompleted: boolean;
  timelinePosition: number;
  statusIndicator: StatusIndicator;
  timingAlert?: TimingAlert;
}

export interface TimelineEntry {
  id: string;
  title: string;
  subtitle: string;
  responsible: string;
  startTime: string;
  endTime: string;
  duration: number;
  order: number;
  position: {
    left: number; // Percentage
    width: number; // Percentage
    top: number; // Pixels
  };
  status: "pending" | "active" | "completed";
  color: string;
  icon: string;
  description: string;
  timingIndicator: {
    isOnTime: boolean;
    isLate: boolean;
    isEarly: boolean;
    message: string;
  };
}

export interface TimelineData {
  entries: TimelineEntry[];
  metrics: TimelineMetrics;
  totalDuration: number;
  estimatedEndTime: string;
}

interface TimelineMetrics {
  totalDuration: number;
  totalMoments: number;
  estimatedEndTime: string;
  averageDuration: number;
  longestMoment: {
    title: string;
    duration: number;
  } | null;
  shortestMoment: {
    title: string;
    duration: number;
  } | null;
}

interface StatusIndicator {
  type: "pending" | "active" | "completed" | "alert";
  color: string;
  message: string;
}

type TimingAlert = "late" | "early" | "overrunning";
