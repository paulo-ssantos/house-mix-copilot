import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  JinaClientConfig,
  JinaAPIError,
  ClassificationRequest,
  ClassificationResponse,
  SearchRequest,
  SearchResponse,
  DeepSearchRequest,
  DeepSearchChunk,
  RerankerRequest,
  RerankerResponse,
  SegmenterRequest,
  SegmenterResponse,
  ReaderRequest,
  ReaderResponse,
} from "./types/jina.types.js";

/**
 * Jina AI API Client for Church Liturgy Automation
 *
 * Provides access to all Jina AI APIs with proper error handling,
 * retry logic, and Portuguese language optimization for church liturgy use cases.
 *
 * Get your Jina AI API key for free: https://jina.ai/?sui=apikey
 */
export class JinaClient {
  private client: AxiosInstance;
  private config: JinaClientConfig;

  constructor(config: JinaClientConfig) {
    this.config = {
      baseURL: "https://api.jina.ai",
      timeout: 30000,
      retries: 3,
      ...config,
    };

    if (!config.apiKey) {
      throw new JinaAPIError(
        "JINA_API_KEY is required. Get your free API key at https://jina.ai/?sui=apikey"
      );
    }

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Church-Liturgy-Copilot/1.0",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Jina API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config, response } = error;

        if (response?.status === 429 && config.retries > 0) {
          // Rate limit retry with exponential backoff
          const delay =
            Math.pow(2, this.config.retries! - config.retries) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          config.retries--;
          return this.client.request(config);
        }

        throw new JinaAPIError(
          response?.data?.message || error.message,
          response?.status,
          response?.data
        );
      }
    );
  }

  /**
   * Classification API - Zero-shot classification for text or images
   * Best for categorizing liturgy moments, identifying prayer types, etc.
   */
  async classify(
    request: ClassificationRequest
  ): Promise<ClassificationResponse> {
    try {
      const response: AxiosResponse<ClassificationResponse> =
        await this.client.post("/v1/classify", request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Classification API");
    }
  }

  /**
   * Search API - Web search optimized for LLMs
   * Best for finding liturgy resources, external content, etc.
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    try {
      const response: AxiosResponse<SearchResponse> = await this.client.post(
        "https://s.jina.ai/",
        request,
        {
          headers: {
            "X-No-Cache": "true",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Search API");
    }
  }

  /**
   * DeepSearch API - Advanced web searching with reasoning
   * Best for complex liturgy research, finding specific religious content
   */
  async deepSearch(
    request: DeepSearchRequest
  ): Promise<AsyncIterable<DeepSearchChunk>> {
    try {
      const response = await this.client.post(
        "https://deepsearch.jina.ai/v1/chat/completions",
        { ...request, stream: true },
        {
          responseType: "stream",
          headers: {
            Accept: "text/event-stream",
          },
        }
      );

      return this.parseDeepSearchStream(response.data);
    } catch (error) {
      throw this.handleError(error, "DeepSearch API");
    }
  }

  /**
   * Reranker API - Improve search result relevance
   * Best for ranking liturgy resources by relevance to specific moments
   */
  async rerank(request: RerankerRequest): Promise<RerankerResponse> {
    try {
      const response: AxiosResponse<RerankerResponse> = await this.client.post(
        "/v1/rerank",
        request
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Reranker API");
    }
  }

  /**
   * Segmenter API - Split text into manageable chunks
   * Best for breaking down long liturgy programs into individual moments
   */
  async segment(request: SegmenterRequest): Promise<SegmenterResponse> {
    try {
      const response: AxiosResponse<SegmenterResponse> = await this.client.post(
        "https://segment.jina.ai/",
        request
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Segmenter API");
    }
  }

  /**
   * Reader API - Extract content from web pages
   * Best for reading liturgy resources, external church content
   */
  async read(request: ReaderRequest): Promise<ReaderResponse> {
    try {
      const response: AxiosResponse<ReaderResponse> = await this.client.post(
        "https://r.jina.ai/",
        request,
        {
          headers: {
            "X-No-Cache": "true",
            "X-Return-Format": "markdown",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Reader API");
    }
  }

  /**
   * Parse DeepSearch streaming response
   */
  private async *parseDeepSearchStream(
    stream: any
  ): AsyncIterable<DeepSearchChunk> {
    let buffer = "";

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data) as DeepSearchChunk;
            yield parsed;
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  }

  /**
   * Handle API errors with context
   */
  private handleError(error: any, apiName: string): JinaAPIError {
    if (error instanceof JinaAPIError) {
      return error;
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      `${apiName} request failed`;
    const status = error.response?.status;

    console.error(`[Jina API Error] ${apiName}:`, {
      message,
      status,
      data: error.response?.data,
    });

    return new JinaAPIError(message, status, error.response?.data);
  }

  /**
   * Test API connectivity and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple classification request
      await this.classify({
        model: "jina-embeddings-v3",
        input: ["test"],
        labels: ["test", "verification"],
      });
      return true;
    } catch (error) {
      console.error("[Jina Client] Connection test failed:", error);
      return false;
    }
  }
}

/**
 * Create Jina client instance with environment variables
 * Get your Jina AI API key for free: https://jina.ai/?sui=apikey
 */
export function createJinaClient(
  config?: Partial<JinaClientConfig>
): JinaClient {
  const apiKey = process.env.JINA_API_KEY || config?.apiKey;

  if (!apiKey) {
    throw new JinaAPIError(
      "JINA_API_KEY environment variable is required. Get your free API key at https://jina.ai/?sui=apikey"
    );
  }

  return new JinaClient({
    apiKey,
    ...config,
  });
}
