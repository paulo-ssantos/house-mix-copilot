import axios, { AxiosInstance } from "axios";
import {
  JinaClientConfig,
  ClassificationRequest,
  ClassificationResponse,
  SegmenterRequest,
  SegmenterResponse,
} from "./types";

/**
 * Jina AI API Client for Church Liturgy Automation
 */
export class JinaClient {
  private client: AxiosInstance;
  private config: JinaClientConfig;

  constructor(config: JinaClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL || "https://api.jina.ai",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Classify text segments for liturgy moment identification
   */
  async classify(request: ClassificationRequest): Promise<ClassificationResponse> {
    try {
      const response = await this.client.post("/v1/classify", request);
      return response.data;
    } catch (error) {
      console.error("Jina Classification API error:", error);
      throw new Error(`Classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Segment text into chunks for better analysis
   */
  async segment(request: SegmenterRequest): Promise<SegmenterResponse> {
    try {
      const response = await this.client.post("/v1/segment", request);
      return response.data;
    } catch (error) {
      console.error("Jina Segmenter API error:", error);
      throw new Error(`Segmentation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
