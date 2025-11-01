import { JinaClient } from "../client.js";
import {
  VideoResearchRequest,
  VideoResult,
  LiturgyMoment,
  DeepSearchRequest,
  DeepSearchMessage,
} from "../types/jina.types.js";

/**
 * VideoResearcher - Intelligent video discovery for liturgy moments
 *
 * Uses Jina DeepSearch API to find relevant videos for liturgy moments,
 * with integration ready for existing YouTube auto-download service.
 * Optimized for Brazilian Portuguese church content.
 */
export class VideoResearcher {
  constructor(private jinaClient: JinaClient) {}

  /**
   * Research and find relevant videos for a liturgy moment
   */
  async researchVideos(request: VideoResearchRequest): Promise<VideoResult[]> {
    try {
      console.log(
        `[VideoResearcher] Researching videos for: ${request.moment.title}`
      );

      // Step 1: Generate research query using DeepSearch
      const deepSearchQuery = this.buildDeepSearchQuery(request);

      // Step 2: Perform deep research
      const researchResults = await this.performDeepResearch(deepSearchQuery);

      // Step 3: Extract video information from research results
      const videos = await this.extractVideoInformation(
        researchResults,
        request.moment
      );

      // Step 4: Filter and rank videos
      const filteredVideos = this.filterAndRankVideos(videos, request);

      console.log(
        `[VideoResearcher] Found ${filteredVideos.length} relevant videos`
      );

      return filteredVideos;
    } catch (error) {
      console.error("[VideoResearcher] Video research failed:", error);
      throw error;
    }
  }

  /**
   * Build a comprehensive deep search query for video research
   */
  private buildDeepSearchQuery(request: VideoResearchRequest): string {
    const moment = request.moment;
    const momentType = moment.type || "";
    const title = moment.title;

    let query = `Encontre vídeos relevantes para o momento litúrgico "${title}"`;

    // Add context based on moment type
    switch (momentType) {
      case "Cântico":
      case "Louvor":
        query += ` do tipo ${momentType}. Procure por vídeos de hinos, cânticos evangélicos, músicas gospel em português brasileiro. `;
        query += `Incluir cifras, playbacks, versões instrumentais e apresentações ao vivo.`;
        break;

      case "Oração":
        query += ` do tipo oração. Procure por vídeos de orações evangelicas, momentos de oração em cultos, `;
        query += `orações dirigidas e exemplos de orações para ${title}.`;
        break;

      case "Pregação":
        query += ` do tipo pregação. Procure por sermões, pregações evangélicas sobre o tema "${title}", `;
        query += `estudos bíblicos e mensagens inspiradoras.`;
        break;

      case "Leitura Bíblica":
        query += ` de leitura bíblica. Procure por vídeos de leitura da Bíblia, textos bíblicos narrados, `;
        query += `dramatizações bíblicas relacionadas a "${title}".`;
        break;

      case "Testemunho":
        query += ` de testemunho. Procure por vídeos de testemunhos cristãos, histórias de vida, `;
        query += `transformações e experiências com Deus relacionadas a "${title}".`;
        break;

      default:
        query += ` do tipo ${momentType}. Procure por vídeos cristãos evangélicos relacionados ao tema.`;
    }

    // Add specific requirements
    query += ` Foque em conteúdo em português brasileiro, de igrejas evangélicas, pastores reconhecidos `;
    query += `e ministérios de música gospel. Priorize vídeos com boa qualidade de áudio e vídeo.`;

    // Add duration preferences
    if (request.minDuration || request.maxDuration) {
      query += ` Considere vídeos`;
      if (request.minDuration)
        query += ` com pelo menos ${request.minDuration} minutos`;
      if (request.maxDuration)
        query += ` e no máximo ${request.maxDuration} minutos`;
      query += ` de duração.`;
    }

    // Add platform preferences
    query += ` Procure principalmente no YouTube, mas considere outras plataformas como Vimeo se relevante.`;

    return query;
  }

  /**
   * Perform deep research using Jina DeepSearch API
   */
  private async performDeepResearch(query: string): Promise<string> {
    const messages: DeepSearchMessage[] = [
      {
        role: "user",
        content: query,
      },
    ];

    const deepSearchRequest: DeepSearchRequest = {
      model: "jina-deepsearch-v1",
      messages,
      reasoning_effort: "medium",
      max_attempts: 2,
      no_direct_answer: false,
      max_returned_urls: 15,
      boost_hostnames: [
        "youtube.com",
        "youtu.be",
        "vimeo.com",
        "gospel.com.br",
        "evangelicos.com",
        "igospel.com.br",
      ],
      bad_hostnames: ["pornhub.com", "xvideos.com", "spam.com", "ads.com"],
    };

    try {
      const streamResponse = await this.jinaClient.deepSearch(
        deepSearchRequest
      );
      let fullResponse = "";

      // Collect streaming response
      for await (const chunk of streamResponse) {
        if (chunk.choices[0]?.delta?.content) {
          fullResponse += chunk.choices[0].delta.content;
        }
      }

      return fullResponse;
    } catch (error) {
      console.error("[VideoResearcher] DeepSearch failed:", error);
      throw error;
    }
  }

  /**
   * Extract video information from DeepSearch results
   */
  private async extractVideoInformation(
    researchText: string,
    moment: LiturgyMoment
  ): Promise<VideoResult[]> {
    const videos: VideoResult[] = [];

    // Extract YouTube URLs
    const youtubeRegex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    let match;

    while ((match = youtubeRegex.exec(researchText)) !== null) {
      const videoId = match[1];
      const url = `https://www.youtube.com/watch?v=${videoId}`;

      // Try to extract title and description from context
      const contextStart = Math.max(0, match.index - 200);
      const contextEnd = Math.min(researchText.length, match.index + 200);
      const context = researchText.substring(contextStart, contextEnd);

      const video: VideoResult = {
        title:
          this.extractTitleFromContext(context) || `Vídeo para ${moment.title}`,
        url,
        description:
          this.extractDescriptionFromContext(context) ||
          `Vídeo relacionado ao momento: ${moment.title}`,
        type: "video",
        relevanceScore: this.calculateVideoRelevance(context, moment),
        source: "jina-deepsearch",
        videoId,
        platform: "youtube",
        duration: undefined, // Will be filled by YouTube service integration
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      };

      videos.push(video);
    }

    // Extract Vimeo URLs
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/g;
    while ((match = vimeoRegex.exec(researchText)) !== null) {
      const videoId = match[1];
      const url = `https://vimeo.com/${videoId}`;

      const contextStart = Math.max(0, match.index - 200);
      const contextEnd = Math.min(researchText.length, match.index + 200);
      const context = researchText.substring(contextStart, contextEnd);

      const video: VideoResult = {
        title:
          this.extractTitleFromContext(context) || `Vídeo para ${moment.title}`,
        url,
        description:
          this.extractDescriptionFromContext(context) ||
          `Vídeo relacionado ao momento: ${moment.title}`,
        type: "video",
        relevanceScore: this.calculateVideoRelevance(context, moment),
        source: "jina-deepsearch",
        videoId,
        platform: "vimeo",
      };

      videos.push(video);
    }

    return videos;
  }

  /**
   * Extract title from context around video URL
   */
  private extractTitleFromContext(context: string): string | undefined {
    // Look for common title patterns
    const titlePatterns = [
      /"([^"]{10,100})"/g, // Text in quotes
      /título:\s*([^\n\.]{10,100})/gi, // "título: ..."
      /title:\s*([^\n\.]{10,100})/gi, // "title: ..."
      /([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^\.!\?\n]{10,80})/g, // Capitalized sentences
    ];

    for (const pattern of titlePatterns) {
      const match = pattern.exec(context);
      if (match && match[1]) {
        const title = match[1].trim();
        if (title.length >= 10 && title.length <= 100) {
          return title;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract description from context around video URL
   */
  private extractDescriptionFromContext(context: string): string | undefined {
    // Clean and truncate context as description
    const cleaned = context
      .replace(/https?:\/\/[^\s]+/g, "") // Remove URLs
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    if (cleaned.length > 20) {
      return cleaned.substring(0, 200) + "...";
    }

    return undefined;
  }

  /**
   * Calculate video relevance based on context and moment
   */
  private calculateVideoRelevance(
    context: string,
    moment: LiturgyMoment
  ): number {
    let score = 0.5; // Base score

    const contextLower = context.toLowerCase();
    const momentTitle = moment.title.toLowerCase();
    const momentType = (moment.type || "").toLowerCase();

    // Boost score for title matches
    if (contextLower.includes(momentTitle)) {
      score += 0.3;
    }

    // Boost score for type matches
    if (contextLower.includes(momentType)) {
      score += 0.2;
    }

    // Boost score for Portuguese content
    const portugueseWords = [
      "português",
      "brasileiro",
      "brasil",
      "igreja",
      "evangélica",
      "gospel",
    ];
    for (const word of portugueseWords) {
      if (contextLower.includes(word)) {
        score += 0.05;
      }
    }

    // Reduce score for non-relevant content
    const irrelevantWords = [
      "spam",
      "advertisement",
      "click",
      "subscribe",
      "like",
    ];
    for (const word of irrelevantWords) {
      if (contextLower.includes(word)) {
        score -= 0.1;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Filter and rank videos based on request criteria
   */
  private filterAndRankVideos(
    videos: VideoResult[],
    request: VideoResearchRequest
  ): VideoResult[] {
    let filtered = videos;

    // Remove duplicates based on videoId
    const unique = new Map<string, VideoResult>();
    for (const video of filtered) {
      const key = video.videoId || video.url;
      if (
        !unique.has(key) ||
        unique.get(key)!.relevanceScore < video.relevanceScore
      ) {
        unique.set(key, video);
      }
    }
    filtered = Array.from(unique.values());

    // Filter by relevance score
    filtered = filtered.filter((video) => video.relevanceScore > 0.4);

    // Sort by relevance score (descending)
    filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit results
    const maxResults = request.maxResults || 10;
    filtered = filtered.slice(0, maxResults);

    return filtered;
  }

  /**
   * Get video metadata for YouTube integration
   */
  getVideoDownloadInfo(video: VideoResult): {
    url: string;
    videoId: string | undefined;
    platform: string;
    title: string;
  } {
    return {
      url: video.url,
      videoId: video.videoId,
      platform: video.platform,
      title: video.title,
    };
  }

  /**
   * Get videos by specific criteria for common liturgy moments
   */
  async getQuickVideos(
    momentType: string,
    maxResults: number = 5
  ): Promise<VideoResult[]> {
    const moment: LiturgyMoment = {
      title: momentType,
      description: `Vídeos para ${momentType}`,
      type: momentType,
    };

    const request: VideoResearchRequest = {
      moment,
      maxResults,
      maxDuration: 20, // Prefer shorter videos for quick access
    };

    return this.researchVideos(request);
  }

  /**
   * Research videos with specific query override
   */
  async researchWithQuery(
    query: string,
    moment: LiturgyMoment
  ): Promise<VideoResult[]> {
    try {
      const researchResults = await this.performDeepResearch(query);
      const videos = await this.extractVideoInformation(
        researchResults,
        moment
      );
      return this.filterAndRankVideos(videos, { moment, maxResults: 10 });
    } catch (error) {
      console.error("[VideoResearcher] Custom query research failed:", error);
      return [];
    }
  }
}
