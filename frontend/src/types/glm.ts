/**
 * GLM-4 AI API Type Definitions
 *
 * Type definitions for ZhipuAI's GLM-4 language model API
 * Supports both streaming and non-streaming responses
 *
 * @see https://open.bigmodel.cn/dev/api
 */

// ===== REQUEST TYPES =====

export interface GLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GLMRequestParams {
  /** Model identifier (e.g., 'glm-4-flash', 'glm-4', 'glm-4-plus') */
  model: string;

  /** Conversation messages */
  messages: GLMMessage[];

  /** Enable streaming response (default: false) */
  stream?: boolean;

  /** Temperature for randomness (0.0-1.0, default: 0.95) */
  temperature?: number;

  /** Top-p sampling (0.0-1.0, default: 0.7) */
  top_p?: number;

  /** Max tokens to generate (default: 1024) */
  max_tokens?: number;

  /** Stop sequences */
  stop?: string[];

  /** Enable web search */
  tools?: GLMTool[];

  /** Tool choice strategy */
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export interface GLMTool {
  type: 'web_search' | 'function';
  function?: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
  web_search?: {
    enable: boolean;
    search_query?: string;
  };
}

// ===== RESPONSE TYPES =====

export interface GLMChoice {
  index: number;
  finish_reason: 'stop' | 'length' | 'tool_calls' | null;
  message: {
    role: 'assistant';
    content: string;
    tool_calls?: GLMToolCall[];
  };
}

export interface GLMToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface GLMUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface GLMResponse {
  id: string;
  created: number;
  model: string;
  choices: GLMChoice[];
  usage: GLMUsage;
  object: 'chat.completion';
}

// ===== STREAMING RESPONSE TYPES =====

export interface GLMStreamDelta {
  role?: 'assistant';
  content?: string;
  tool_calls?: Partial<GLMToolCall>[];
}

export interface GLMStreamChoice {
  index: number;
  delta: GLMStreamDelta;
  finish_reason: 'stop' | 'length' | 'tool_calls' | null;
}

export interface GLMStreamChunk {
  id: string;
  created: number;
  model: string;
  choices: GLMStreamChoice[];
  object: 'chat.completion.chunk';
}

// ===== ERROR TYPES =====

export interface GLMError {
  error: {
    code: string;
    message: string;
    type: string;
  };
}

// ===== SUMMARY-SPECIFIC TYPES =====

export interface AISummaryRequest {
  /** Report data to summarize */
  reportData: ReportDataForSummary;

  /** Type of report (guides, features, pages, reports) */
  reportType: 'guides' | 'features' | 'pages' | 'reports';

  /** Additional context or instructions */
  additionalContext?: string;

  /** Enable streaming response */
  stream?: boolean;
}

export interface ReportDataForSummary {
  // Core identity
  id: string;
  name: string;
  type: string;

  // Key metrics (automatically extracted based on report type)
  metrics: Record<string, number | string>;

  // Time period
  period?: {
    start: string;
    end: string;
  };

  // Additional context
  topInsights?: string[];
  trends?: Array<{ metric: string; direction: 'up' | 'down' | 'stable'; change: number }>;
}

export interface AISummaryResponse {
  /** Generated summary text */
  summary: string;

  /** Key insights extracted */
  insights: string[];

  /** Recommendations */
  recommendations?: string[];

  /** Metadata */
  metadata: {
    model: string;
    tokensUsed: number;
    generatedAt: string;
    processingTime: number;
  };

  /** Error information if any */
  error?: string;
}

// ===== DATA COMPRESSION HELPERS =====

export interface CompressedMetrics {
  primary: Record<string, number | string>;
  trends?: Array<{ m: string; d: string; v: number }>;
  top?: Array<{ n: string; v: number }>;
}

// ===== CONFIGURATION =====

export interface GLMConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
}

// ===== MODEL OPTIONS =====

export const GLM_MODELS = {
  FLASH: 'glm-4-flash',      // Fast, cost-effective
  STANDARD: 'glm-4',          // Balanced performance
  PLUS: 'glm-4-plus',         // Enhanced capabilities
  VISION: 'glm-4v',           // Multimodal
  AIR: 'glm-4-air',           // Lightweight
  AIRX: 'glm-4-airx',         // Extended context
} as const;

export type GLMModel = typeof GLM_MODELS[keyof typeof GLM_MODELS];

// ===== PRESET PROMPTS =====

export interface SummaryPromptConfig {
  systemPrompt: string;
  userPromptTemplate: (data: ReportDataForSummary) => string;
  maxTokens: number;
  temperature: number;
}
