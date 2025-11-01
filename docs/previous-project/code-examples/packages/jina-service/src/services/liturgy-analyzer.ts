import { JinaClient } from "../client.js";
import {
  LiturgyAnalysisRequest,
  LiturgyAnalysisResult,
  LiturgyMoment,
  ClassificationRequest,
  SegmenterRequest,
} from "../types/jina.types.js";

/**
 * LiturgyAnalyzer - AI-powered liturgy program analysis
 *
 * Uses Jina Classification and Segmenter APIs to automatically identify
 * liturgy moments, extract timing, and structure unorganized liturgy programs
 * for Brazilian church sound and projection teams.
 */
export class LiturgyAnalyzer {
  constructor(private jinaClient: JinaClient) {}

  /**
   * Analyze raw liturgy program text and extract structured moments
   */
  async analyzeLiturgyProgram(
    request: LiturgyAnalysisRequest
  ): Promise<LiturgyAnalysisResult> {
    try {
      console.log("[LiturgyAnalyzer] Starting liturgy program analysis...");

      // Step 1: Segment the text into manageable chunks
      const segments = await this.segmentLiturgyText(request.rawText);
      console.log(`[LiturgyAnalyzer] Found ${segments.length} text segments`);

      // Step 2: Classify each segment to identify liturgy moments
      const moments: LiturgyMoment[] = [];
      let totalConfidence = 0;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        console.log(
          `[LiturgyAnalyzer] Processing segment ${i}: "${segment.substring(
            0,
            80
          )}..."`
        );
        if (segment.trim().length < 10) {
          console.log(
            `[LiturgyAnalyzer] Skipping short segment ${i} (${
              segment.trim().length
            } chars)`
          );
          continue; // Skip very short segments
        }

        const moment = await this.classifyLiturgySegment(segment, i);
        if (moment) {
          moments.push(moment);
          totalConfidence += moment.confidence || 0;
        }
      }

      // Step 3: Extract timing information from moments
      await this.extractTimingInformation(moments);

      // Step 4: Identify responsible persons
      await this.identifyResponsiblePersons(moments);

      const averageConfidence =
        moments.length > 0 ? totalConfidence / moments.length : 0;

      console.log(
        `[LiturgyAnalyzer] Analysis complete: ${moments.length} moments identified`
      );

      return {
        moments,
        totalDuration: this.calculateTotalDuration(moments),
        confidence: averageConfidence,
        sourceText: request.rawText,
      };
    } catch (error) {
      console.error("[LiturgyAnalyzer] Analysis failed:", error);
      throw error;
    }
  }

  /**
   * Segment liturgy text into individual moments using pattern recognition
   * This approach works better for structured liturgy programs than semantic chunking
   */
  private async segmentLiturgyText(text: string): Promise<string[]> {
    // Pattern for liturgy moments: time - title - responsible person
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const segments: string[] = [];

    for (const line of lines) {
      // Look for lines that contain time patterns and liturgy content
      if (this.isLiturgyMomentLine(line)) {
        segments.push(line);
      }
    }

    console.log(
      `[LiturgyAnalyzer] Extracted ${segments.length} potential liturgy moments from text parsing`
    );

    // If no structured moments found, fall back to Jina segmentation
    if (segments.length === 0) {
      console.log(
        "[LiturgyAnalyzer] No structured moments found, using semantic segmentation"
      );
      return this.fallbackSegmentation(text);
    }

    return segments;
  }

  /**
   * Check if a line represents a liturgy moment
   */
  private isLiturgyMomentLine(line: string): boolean {
    // Patterns for liturgy moments:
    // - Time pattern: "19:00", "20:30", etc.
    // - Common liturgy words in Portuguese
    const timePattern = /\d{1,2}:\d{2}/;
    const liturgyKeywords = [
      "oração",
      "cântico",
      "louvor",
      "leitura",
      "pregação",
      "mensagem",
      "ofertório",
      "comunhão",
      "bênção",
      "prelúdio",
      "poslúdio",
      "abertura",
      "convite",
      "avisos",
      "adoração",
      "testemunho",
      "anúncios",
      "especial",
    ];

    const hasTimePattern = timePattern.test(line);
    const hasLiturgyKeyword = liturgyKeywords.some((keyword) =>
      line.toLowerCase().includes(keyword)
    );

    return hasTimePattern || (hasLiturgyKeyword && line.length > 15);
  }

  /**
   * Fallback to Jina semantic segmentation when structured parsing fails
   */
  private async fallbackSegmentation(text: string): Promise<string[]> {
    try {
      const request: SegmenterRequest = {
        content: text,
        tokenizer: "cl100k_base",
        return_chunks: true,
        max_chunk_length: 300, // Smaller chunks for better classification
      };

      const response = await this.jinaClient.segment(request);
      return response.chunks || [text];
    } catch (error) {
      console.error(
        "[LiturgyAnalyzer] Segmentation failed, using line-by-line approach:",
        error
      );
      // Final fallback: split by double newlines
      return text.split("\n\n").filter((chunk) => chunk.trim().length > 10);
    }
  }

  /**
   * Classify a liturgy segment to identify the type of moment
   */
  private async classifyLiturgySegment(
    segment: string,
    index: number
  ): Promise<LiturgyMoment | null> {
    // Portuguese liturgy moment labels for Brazilian churches
    const liturgyLabels = [
      "Oração", // Prayer
      "Cântico", // Song/Hymn
      "Louvor", // Praise
      "Leitura Bíblica", // Bible Reading
      "Pregação", // Preaching
      "Mensagem", // Message/Sermon
      "Comunhão", // Communion
      "Ofertório", // Offering
      "Anúncios", // Announcements
      "Avisos", // Announcements/Notices
      "Bênção", // Blessing
      "Adoração", // Worship
      "Testemunho", // Testimony
      "Oração do Pai Nosso", // Lord's Prayer
      "Doxologia", // Doxology
      "Momento Musical", // Musical moment
      "Prelúdio", // Prelude
      "Poslúdio", // Postlude
      "Intercessão", // Intercession
      "Reflexão", // Reflection
      "Convite", // Invitation/Altar call
      "Despedida", // Dismissal
      "Abertura", // Opening
    ];

    const classificationRequest: ClassificationRequest = {
      model: "jina-embeddings-v3", // Good for Portuguese text
      input: [segment],
      labels: liturgyLabels,
    };

    try {
      const response = await this.jinaClient.classify(classificationRequest);
      const result = response.data[0];

      console.log(`[LiturgyAnalyzer] Segment ${index}: "${segment.substring(
        0,
        50
      )}..." 
        → Classification: ${result.prediction} (score: ${result.score.toFixed(
        3
      )})`);

      if (result && result.score > 0.05) {
        // Very low threshold - Jina classification is conservative but accurate
        return {
          id: `moment_${index}`,
          title: this.extractTitle(segment) || result.prediction,
          description: this.extractDescription(segment),
          type: result.prediction,
          confidence: result.score,
          responsible: undefined, // Will be filled later
          startTime: undefined, // Will be filled later
          duration: undefined, // Will be filled later
        };
      }

      return null;
    } catch (error) {
      console.error(
        `[LiturgyAnalyzer] Failed to classify segment ${index}:`,
        error
      );
      return null;
    }
  }

  /**
   * Extract timing information from liturgy moments
   */
  private async extractTimingInformation(
    moments: LiturgyMoment[]
  ): Promise<void> {
    for (const moment of moments) {
      // Look for time patterns in title and description
      const timeRegex = /(\d{1,2}):(\d{2})|(\d+)\s*min/gi;
      const text = `${moment.title} ${moment.description || ""}`;

      const timeMatch = timeRegex.exec(text);
      if (timeMatch) {
        if (timeMatch[1] && timeMatch[2]) {
          // Time format (HH:MM)
          moment.startTime = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
        } else if (timeMatch[3]) {
          // Duration in minutes
          moment.duration = parseInt(timeMatch[3]);
        }
      }

      // Default durations based on liturgy moment type
      if (!moment.duration) {
        moment.duration = this.getDefaultDuration(moment.type || "");
      }
    }

    // Calculate start times based on sequence if not explicitly provided
    this.calculateSequentialTiming(moments);
  }

  /**
   * Identify responsible persons from liturgy moments
   */
  private async identifyResponsiblePersons(
    moments: LiturgyMoment[]
  ): Promise<void> {
    // Common patterns for responsible persons in Portuguese
    const personPatterns = [
      /(?:pastor|pr\.?|reverendo|rev\.?)\s+([a-záàâãéêíóôõúç\s]+)/gi,
      /(?:liderado por|conduzido por|dirigido por)\s+([a-záàâãéêíóôõúç\s]+)/gi,
      /(?:ministério|grupo|coral)\s+([a-záàâãéêíóôõúç\s]+)/gi,
      /([a-záàâãéêíóôõúç\s]+)\s+(?:conduzirá|dirigirá|liderará)/gi,
    ];

    for (const moment of moments) {
      const text = `${moment.title} ${moment.description || ""}`;

      for (const pattern of personPatterns) {
        const match = pattern.exec(text);
        if (match && match[1]) {
          moment.responsible = match[1].trim();
          break;
        }
      }

      // Default responsible person based on moment type
      if (!moment.responsible) {
        moment.responsible = this.getDefaultResponsible(moment.type || "");
      }
    }
  }

  /**
   * Extract title from segment text
   */
  private extractTitle(segment: string): string | undefined {
    // Look for titles at the beginning of segments
    const lines = segment
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    if (lines.length > 0) {
      const firstLine = lines[0];
      // Check if first line looks like a title (short, capitalized, etc.)
      if (firstLine.length < 100 && /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(firstLine)) {
        return firstLine;
      }
    }
    return undefined;
  }

  /**
   * Extract description from segment text
   */
  private extractDescription(segment: string): string {
    const lines = segment
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    if (lines.length > 1) {
      return lines.slice(1).join(" ").substring(0, 200) + "...";
    }
    return segment.substring(0, 200) + "...";
  }

  /**
   * Get default duration based on liturgy moment type (in minutes)
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
      "Oração do Pai Nosso": 2,
      Doxologia: 3,
      "Momento Musical": 6,
      Intercessão: 10,
      Reflexão: 5,
      Convite: 10,
      Despedida: 2,
    };

    return durationMap[type] || 5; // Default 5 minutes
  }

  /**
   * Get default responsible person based on moment type
   */
  private getDefaultResponsible(type: string): string {
    const responsibleMap: Record<string, string> = {
      Pregação: "Pastor",
      Oração: "Líder de Oração",
      "Leitura Bíblica": "Leitor",
      Cântico: "Ministério de Música",
      Louvor: "Ministério de Louvor",
      Comunhão: "Pastor",
      Ofertório: "Diácono",
      Anúncios: "Secretário",
      Bênção: "Pastor",
      Adoração: "Ministério de Louvor",
      Testemunho: "Membro",
      "Momento Musical": "Ministério de Música",
      Intercessão: "Líder de Oração",
      Convite: "Pastor",
      Despedida: "Pastor",
    };

    return responsibleMap[type] || "A definir";
  }

  /**
   * Calculate total duration of all moments
   */
  private calculateTotalDuration(moments: LiturgyMoment[]): number {
    return moments.reduce((total, moment) => total + (moment.duration || 0), 0);
  }

  /**
   * Calculate sequential timing for moments without explicit start times
   */
  private calculateSequentialTiming(moments: LiturgyMoment[]): void {
    let currentTime = new Date();
    currentTime.setHours(19, 0, 0, 0); // Default start time 19:00

    for (const moment of moments) {
      if (!moment.startTime) {
        moment.startTime = currentTime.toTimeString().substring(0, 5);
      }

      // Add duration to current time for next moment
      if (moment.duration) {
        currentTime.setMinutes(currentTime.getMinutes() + moment.duration);
      }
    }
  }
}
