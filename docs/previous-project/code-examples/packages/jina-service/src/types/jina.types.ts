// Jina AI API Types for Church Liturgy Automation

// Common types
export interface JinaResponse<T> {
  code?: number;
  status?: number;
  data: T;
  usage?: {
    tokens?: number;
    total_tokens?: number;
  };
}

export interface JinaError {
  message: string;
  field?: string;
}

// Classification API Types
export interface ClassificationRequest {
  model?: string;
  classifier_id?: string;
  input: string[] | { text: string }[] | { image: string }[];
  labels: string[];
}

export interface ClassificationResult {
  index: number;
  prediction: string;
  score: number;
  predictions?: Array<{
    label: string;
    score: number;
  }>;
  object: "classification";
}

export interface ClassificationResponse
  extends JinaResponse<ClassificationResult[]> {}

// Search API Types
export interface SearchRequest {
  q: string;
  gl?: string; // country code
  location?: string;
  hl?: string; // language code
  num?: number;
  page?: number;
}

export interface SearchResult {
  title: string;
  description: string;
  url: string;
  content: string;
  usage?: {
    tokens: number;
  };
}

export interface SearchResponse extends JinaResponse<SearchResult[]> {}

// DeepSearch API Types
export interface DeepSearchMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DeepSearchRequest {
  model: string;
  messages: DeepSearchMessage[];
  stream?: boolean;
  reasoning_effort?: "low" | "medium" | "high";
  budget_tokens?: number;
  max_attempts?: number;
  no_direct_answer?: boolean;
  max_returned_urls?: number;
  response_format?: {
    type: "json_schema";
    json_schema: object;
  };
  boost_hostnames?: string[];
  bad_hostnames?: string[];
  only_hostnames?: string[];
}

export interface DeepSearchChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  system_fingerprint: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      type?: string;
    };
    logprobs: null;
    finish_reason: string | null;
  }>;
}

// Reranker API Types
export interface RerankerRequest {
  model: string;
  query: string;
  documents: string[] | object[];
  top_n?: number;
  return_documents?: boolean;
}

export interface RerankerResult {
  index: number;
  relevance_score: number;
  document?: string;
}

export interface RerankerResponse {
  model: string;
  usage: {
    total_tokens: number;
  };
  results: RerankerResult[];
}

// Segmenter API Types
export interface SegmenterRequest {
  content: string;
  tokenizer?:
    | "cl100k_base"
    | "o200k_base"
    | "p50k_base"
    | "r50k_base"
    | "p50k_edit"
    | "gpt2";
  return_tokens?: boolean;
  return_chunks?: boolean;
  max_chunk_length?: number;
  head?: number;
  tail?: number;
}

export interface SegmenterResponse {
  num_tokens: number;
  tokenizer: string;
  usage: {
    tokens: number;
  };
  num_chunks?: number;
  chunk_positions?: Array<[number, number]>;
  tokens?: Array<Array<[string, number[]]>>;
  chunks?: string[];
}

// Reader API Types
export interface ReaderRequest {
  url: string;
  viewport?: {
    width: number;
    height: number;
  };
  injectPageScript?: string;
}

export interface ReaderResponse
  extends JinaResponse<{
    title: string;
    description: string;
    url: string;
    content: string;
    images?: Record<string, string>;
    links?: Record<string, string>;
  }> {}

// Liturgy-specific types
export interface LiturgyMoment {
  id?: string;
  title: string;
  description: string;
  responsible?: string;
  startTime?: string;
  duration?: number;
  type?: string;
  confidence?: number;
}

export interface LiturgyAnalysisRequest {
  rawText: string;
  language?: "pt" | "en";
  context?: "catholic" | "protestant" | "evangelical";
}

export interface LiturgyAnalysisResult {
  moments: LiturgyMoment[];
  totalDuration?: number;
  confidence: number;
  sourceText: string;
}

export interface ResourceSearchRequest {
  moment: LiturgyMoment;
  resourceTypes?: string[];
  maxResults?: number;
}

export interface ResourceResult {
  title: string;
  url: string;
  description: string;
  type: "video" | "audio" | "text" | "image" | "document";
  relevanceScore: number;
  source: string;
}

export interface VideoResearchRequest {
  moment: LiturgyMoment;
  query?: string;
  maxResults?: number;
  minDuration?: number;
  maxDuration?: number;
}

export interface VideoResult extends ResourceResult {
  type: "video";
  duration?: number;
  thumbnail?: string;
  videoId?: string;
  platform: "youtube" | "vimeo" | "other";
}

// Configuration types
export interface JinaClientConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
}

// Error handling
export class JinaAPIError extends Error {
  constructor(message: string, public status?: number, public response?: any) {
    super(message);
    this.name = "JinaAPIError";
  }
}
