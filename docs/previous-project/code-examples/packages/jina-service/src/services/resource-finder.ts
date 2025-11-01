import { JinaClient } from "../client.js";
import {
  ResourceSearchRequest,
  ResourceResult,
  LiturgyMoment,
  SearchRequest,
  RerankerRequest,
} from "../types/jina.types.js";

/**
 * ResourceFinder - Intelligent resource discovery for liturgy moments
 *
 * Uses Jina Search and Reranker APIs to automatically find relevant
 * external resources (texts, songs, prayers, etc.) for each liturgy moment
 * in Brazilian Portuguese church context.
 */
export class ResourceFinder {
  constructor(private jinaClient: JinaClient) {}

  /**
   * Find relevant resources for a liturgy moment
   */
  async findResources(
    request: ResourceSearchRequest
  ): Promise<ResourceResult[]> {
    try {
      console.log(
        `[ResourceFinder] Finding resources for: ${request.moment.title}`
      );

      // Step 1: Generate search queries for the liturgy moment
      const searchQueries = this.generateSearchQueries(request.moment);

      // Step 2: Search for each query
      const allResults: ResourceResult[] = [];

      for (const query of searchQueries) {
        const searchResults = await this.searchForQuery(query, request.moment);
        allResults.push(...searchResults);
      }

      // Step 3: Remove duplicates
      const uniqueResults = this.removeDuplicateResults(allResults);

      // Step 4: Rerank results by relevance
      const rankedResults = await this.rerankResults(
        request.moment,
        uniqueResults
      );

      // Step 5: Filter and limit results
      const maxResults = request.maxResults || 10;
      const filteredResults = this.filterResults(
        rankedResults,
        request.resourceTypes
      ).slice(0, maxResults);

      console.log(
        `[ResourceFinder] Found ${filteredResults.length} relevant resources`
      );

      return filteredResults;
    } catch (error) {
      console.error("[ResourceFinder] Resource search failed:", error);
      throw error;
    }
  }

  /**
   * Generate search queries for a liturgy moment
   */
  private generateSearchQueries(moment: LiturgyMoment): string[] {
    const queries: string[] = [];
    const momentType = moment.type || "";
    const title = moment.title;

    // Base query with moment title and type
    queries.push(`${title} ${momentType} igreja evangélica`);

    // Type-specific queries in Portuguese
    switch (momentType) {
      case "Cântico":
      case "Louvor":
        queries.push(`hino ${title} letra cifra`);
        queries.push(`música gospel ${title} evangelica`);
        queries.push(`louvor ${title} cifra acordes`);
        break;

      case "Oração":
        queries.push(`oração ${title} igreja evangelica`);
        queries.push(`texto oração ${title}`);
        break;

      case "Leitura Bíblica":
        queries.push(`leitura bíblica ${title}`);
        queries.push(`texto bíblico ${title}`);
        queries.push(`versículo ${title} bíblia`);
        break;

      case "Pregação":
        queries.push(`sermão ${title} evangélico`);
        queries.push(`pregação ${title} texto`);
        queries.push(`esboço pregação ${title}`);
        break;

      case "Comunhão":
        queries.push(`santa ceia ${title} ritual`);
        queries.push(`comunhão ${title} evangelica`);
        break;

      case "Testemunho":
        queries.push(`testemunho ${title} igreja`);
        queries.push(`testimony ${title} christian`);
        break;

      default:
        queries.push(`${momentType} ${title} igreja`);
        queries.push(`${momentType} evangelico protestant`);
    }

    // Add generic church resource queries
    queries.push(`recursos igreja ${momentType}`);
    queries.push(`material liturgico ${momentType}`);

    return queries.slice(0, 5); // Limit to 5 queries to avoid too many API calls
  }

  /**
   * Search for a specific query using Jina Search API
   */
  private async searchForQuery(
    query: string,
    moment: LiturgyMoment
  ): Promise<ResourceResult[]> {
    const searchRequest: SearchRequest = {
      q: query,
      hl: "pt", // Portuguese language
      gl: "BR", // Brazil location
      num: 8, // Get more results for better reranking
    };

    try {
      const response = await this.jinaClient.search(searchRequest);

      return response.data.map((result, index) => ({
        title: result.title,
        url: result.url,
        description: result.description,
        type: this.determineResourceType(
          result.url,
          result.title,
          result.description
        ),
        relevanceScore: 1.0 - index * 0.1, // Initial score based on search ranking
        source: "jina-search",
      }));
    } catch (error) {
      console.error(
        `[ResourceFinder] Search failed for query: ${query}`,
        error
      );
      return [];
    }
  }

  /**
   * Determine resource type based on URL and content
   */
  private determineResourceType(
    url: string,
    title: string,
    description: string
  ): ResourceResult["type"] {
    const content = `${url} ${title} ${description}`.toLowerCase();

    if (content.includes("youtube.com") || content.includes("youtu.be")) {
      return "video";
    }
    if (
      content.includes("spotify") ||
      content.includes("soundcloud") ||
      content.includes("audio")
    ) {
      return "audio";
    }
    if (content.includes(".pdf") || content.includes("documento")) {
      return "document";
    }
    if (
      content.includes(".jpg") ||
      content.includes(".png") ||
      content.includes("imagem")
    ) {
      return "image";
    }

    return "text"; // Default to text
  }

  /**
   * Remove duplicate results based on URL and title similarity
   */
  private removeDuplicateResults(results: ResourceResult[]): ResourceResult[] {
    const unique = new Map<string, ResourceResult>();

    for (const result of results) {
      const key = `${result.url}-${result.title}`;
      if (
        !unique.has(key) ||
        unique.get(key)!.relevanceScore < result.relevanceScore
      ) {
        unique.set(key, result);
      }
    }

    return Array.from(unique.values());
  }

  /**
   * Rerank results using Jina Reranker API for better relevance
   */
  private async rerankResults(
    moment: LiturgyMoment,
    results: ResourceResult[]
  ): Promise<ResourceResult[]> {
    if (results.length === 0) return results;

    // Create rerank query based on liturgy moment
    const query = `${moment.title} ${moment.type} ${moment.description} igreja evangélica`;

    // Prepare documents for reranking
    const documents = results.map(
      (result) => `${result.title} ${result.description} ${result.url}`
    );

    const rerankRequest: RerankerRequest = {
      model: "jina-reranker-v2-base-multilingual", // Supports Portuguese
      query,
      documents,
      top_n: Math.min(results.length, 20), // Limit results
      return_documents: false, // We already have the documents
    };

    try {
      const response = await this.jinaClient.rerank(rerankRequest);

      // Map reranked results back to original ResourceResult objects
      const rankedResults: ResourceResult[] = [];

      for (const rankResult of response.results) {
        const originalResult = results[rankResult.index];
        if (originalResult) {
          rankedResults.push({
            ...originalResult,
            relevanceScore: rankResult.relevance_score,
          });
        }
      }

      // Sort by relevance score (descending)
      return rankedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error("[ResourceFinder] Reranking failed:", error);
      // Return original results if reranking fails
      return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  }

  /**
   * Filter results by resource types and quality
   */
  private filterResults(
    results: ResourceResult[],
    allowedTypes?: string[]
  ): ResourceResult[] {
    let filtered = results;

    // Filter by allowed types if specified
    if (allowedTypes && allowedTypes.length > 0) {
      filtered = filtered.filter((result) =>
        allowedTypes.includes(result.type)
      );
    }

    // Filter out low-quality results
    filtered = filtered.filter((result) => {
      // Remove results with very low relevance scores
      if (result.relevanceScore < 0.3) return false;

      // Remove results with suspicious URLs
      const suspiciousPatterns = [
        "spam",
        "ads",
        "advertisement",
        "popup",
        "malware",
        "download.exe",
        "click-here",
        "free-money",
      ];

      const urlLower = result.url.toLowerCase();
      if (suspiciousPatterns.some((pattern) => urlLower.includes(pattern))) {
        return false;
      }

      // Remove results with empty or very short descriptions
      if (!result.description || result.description.trim().length < 20) {
        return false;
      }

      return true;
    });

    return filtered;
  }

  /**
   * Get resource preview/summary for display
   */
  async getResourcePreview(url: string): Promise<string | null> {
    try {
      const response = await this.jinaClient.read({ url });

      if (response.data.content) {
        // Return first 200 characters as preview
        return response.data.content.substring(0, 200) + "...";
      }

      return null;
    } catch (error) {
      console.error(
        `[ResourceFinder] Failed to get preview for ${url}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get resources by specific types for a liturgy moment
   */
  async getResourcesByType(
    moment: LiturgyMoment,
    resourceType: ResourceResult["type"]
  ): Promise<ResourceResult[]> {
    const request: ResourceSearchRequest = {
      moment,
      resourceTypes: [resourceType],
      maxResults: 5,
    };

    return this.findResources(request);
  }

  /**
   * Get quick resources for common liturgy moments
   */
  async getQuickResources(momentType: string): Promise<ResourceResult[]> {
    const moment: LiturgyMoment = {
      title: momentType,
      description: `Recursos para ${momentType}`,
      type: momentType,
    };

    const request: ResourceSearchRequest = {
      moment,
      maxResults: 8,
    };

    return this.findResources(request);
  }
}
