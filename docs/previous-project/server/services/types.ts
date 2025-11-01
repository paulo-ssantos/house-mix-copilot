// Type definitions for Jina AI services
export interface LiturgyAnalysisRequest {
  rawText: string;
}

export interface LiturgyMoment {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  confidence?: number;
  responsible?: string;
  startTime?: string;
  duration?: number;
}

export interface LiturgyAnalysisResult {
  moments: LiturgyMoment[];
  totalDuration?: number;
  confidence?: number;
  sourceText?: string;
}

export interface ClassificationRequest {
  model: string;
  input: string[];
  labels: string[];
}

export interface ClassificationResult {
  prediction: string;
  score: number;
}

export interface ClassificationResponse {
  data: ClassificationResult[];
}

export interface SegmenterRequest {
  content: string;
  tokenizer?: string;
  return_chunks?: boolean;
  max_chunk_length?: number;
}

export interface SegmenterResponse {
  chunks?: string[];
}

export interface JinaClientConfig {
  apiKey: string;
  baseURL?: string;
}
