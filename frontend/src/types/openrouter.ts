/**
 * OpenRouter API Type Definitions
 *
 * Type definitions for OpenRouter's unified AI API
 * Compatible with OpenAI API format
 *
 * @see https://openrouter.ai/docs/api-reference
 */

// ===== REQUEST TYPES =====

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface OpenRouterRequestParams {
  /** Model identifier (e.g., 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o') */
  model: string;

  /** Conversation messages */
  messages: OpenRouterMessage[];

  /** Enable streaming response (default: false) */
  stream?: boolean;

  /** Temperature for randomness (0.0-2.0, default: 1.0) */
  temperature?: number;

  /** Top-p sampling (0.0-1.0, default: 1.0) */
  top_p?: number;

  /** Max tokens to generate */
  max_tokens?: number;

  /** Frequency penalty (-2.0 to 2.0) */
  frequency_penalty?: number;

  /** Presence penalty (-2.0 to 2.0) */
  presence_penalty?: number;

  /** Stop sequences */
  stop?: string | string[];

  /** User identifier for abuse prevention */
  user?: string;

  /** OpenRouter-specific: Model routing preferences */
  route?: 'fallback';

  /** OpenRouter-specific: Provider preferences */
  provider?: {
    order?: string[];
    allow_fallbacks?: boolean;
    require_parameters?: boolean;
  };

  /** OpenRouter-specific: Model transforms */
  transforms?: string[];
}

// ===== RESPONSE TYPES =====

export interface OpenRouterChoice {
  index: number;
  finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
  message: {
    role: 'assistant';
    content: string;
    tool_calls?: OpenRouterToolCall[];
  };
  error?: {
    code: number;
    message: string;
  };
}

export interface OpenRouterToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  created: number;
  object: 'chat.completion';
  choices: OpenRouterChoice[];
  usage: OpenRouterUsage;

  /** OpenRouter-specific: The provider that served this request */
  provider?: string;
}

// ===== STREAMING RESPONSE TYPES =====

export interface OpenRouterStreamDelta {
  role?: 'assistant';
  content?: string;
  tool_calls?: Partial<OpenRouterToolCall>[];
}

export interface OpenRouterStreamChoice {
  index: number;
  delta: OpenRouterStreamDelta;
  finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
}

export interface OpenRouterStreamChunk {
  id: string;
  model: string;
  created: number;
  object: 'chat.completion.chunk';
  choices: OpenRouterStreamChoice[];
}

// ===== ERROR TYPES =====

export interface OpenRouterError {
  error: {
    code: number;
    message: string;
    type?: string;
    metadata?: {
      provider_name?: string;
      raw?: string;
    };
  };
}

// ===== SUMMARY-SPECIFIC TYPES (Compatible with existing GLM types) =====

export interface AISummaryRequest {
  /** Report data to summarize */
  reportData: ReportDataForSummary;

  /** Type of report (guides, features, pages, reports) */
  reportType: 'guides' | 'features' | 'pages' | 'reports';

  /** Additional context or instructions */
  additionalContext?: string;

  /** Enable streaming response */
  stream?: boolean;

  /** Optional: Override default model */
  model?: string;
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
    provider?: string;
    tokensUsed: number;
    generatedAt: string;
    processingTime: number;
    costEstimate?: number; // Estimated cost in USD
  };

  /** Error information if any */
  error?: string;
}

// ===== CONFIGURATION =====

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
  appName?: string;
  appUrl?: string;
}

// ===== MODEL OPTIONS =====

export const OPENROUTER_MODELS = {
  // Anthropic Claude models
  CLAUDE_3_5_SONNET: 'anthropic/claude-3.5-sonnet',
  CLAUDE_SONNET_4: 'anthropic/claude-sonnet-4',
  CLAUDE_SONNET_4_5: 'anthropic/claude-sonnet-4.5',
  CLAUDE_3_5_SONNET_BETA: 'anthropic/claude-3.5-sonnet:beta',

  // OpenAI models
  GPT_4O: 'openai/gpt-4o',
  GPT_4O_MINI: 'openai/gpt-4o-mini',
  GPT_4_TURBO: 'openai/gpt-4-turbo',
  O1: 'openai/o1',
  O1_MINI: 'openai/o1-mini',

  // Google models
  GEMINI_PRO_1_5: 'google/gemini-pro-1.5',
  GEMINI_FLASH_1_5: 'google/gemini-flash-1.5',
  GEMINI_2_0_FLASH: 'google/gemini-2.0-flash-exp',

  // DeepSeek models (budget-friendly)
  DEEPSEEK_R1: 'deepseek/deepseek-r1',
  DEEPSEEK_CHAT: 'deepseek/deepseek-chat',

  // Meta Llama models
  LLAMA_4_SCOUT: 'meta-llama/llama-4-scout',
  LLAMA_3_3_70B: 'meta-llama/llama-3.3-70b-instruct',

  // Mistral models
  MISTRAL_LARGE: 'mistralai/mistral-large',
  MISTRAL_MEDIUM: 'mistralai/mistral-medium',

  // Cohere models
  COMMAND_R_PLUS: 'cohere/command-r-plus',
} as const;

export type OpenRouterModel = typeof OPENROUTER_MODELS[keyof typeof OPENROUTER_MODELS];

// ===== MODEL METADATA =====

export interface ModelMetadata {
  id: OpenRouterModel;
  name: string;
  provider: string;
  pricing: {
    prompt: number; // USD per million tokens
    completion: number; // USD per million tokens
  };
  context: number; // Context window size in tokens
  strengths: string[];
  bestFor: string[];
}

export const MODEL_METADATA: Record<string, ModelMetadata> = {
  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    pricing: {
      prompt: 3.0,
      completion: 15.0,
    },
    context: 200000,
    strengths: [
      'Industry-leading reasoning',
      'Excellent analytical capabilities',
      'Nuanced understanding',
      'Strong insight extraction',
    ],
    bestFor: [
      'Analytical insights',
      'Complex reasoning',
      'Structured data analysis',
      'Business recommendations',
    ],
  },
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    pricing: {
      prompt: 5.0,
      completion: 15.0,
    },
    context: 128000,
    strengths: [
      'Fast response times',
      'Multi-modal capabilities',
      'Reliable performance',
      'Good general knowledge',
    ],
    bestFor: [
      'Quick analysis',
      'Multi-modal tasks',
      'General analytics',
      'Time-sensitive requests',
    ],
  },
  'anthropic/claude-sonnet-4.5': {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    pricing: {
      prompt: 3.0, // Estimated
      completion: 15.0, // Estimated
    },
    context: 200000,
    strengths: [
      'Advanced reasoning',
      'Deep analysis mode',
      'Reflection capabilities',
      'Latest generation AI',
    ],
    bestFor: [
      'Complex analytical scenarios',
      'Deep research',
      'Strategic insights',
      'High-stakes decisions',
    ],
  },
  'deepseek/deepseek-r1': {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    pricing: {
      prompt: 0.14, // Significantly cheaper
      completion: 0.28,
    },
    context: 128000,
    strengths: [
      'Exceptional value',
      'Good reasoning',
      'Cost-effective',
      'Suitable for high volume',
    ],
    bestFor: [
      'Budget-conscious deployments',
      'High-volume analysis',
      'Good quality at low cost',
      'Batch processing',
    ],
  },
};

// ===== COST CALCULATION HELPERS =====

/**
 * Calculate estimated cost for a request
 * @param model Model identifier
 * @param promptTokens Number of prompt tokens
 * @param completionTokens Number of completion tokens
 * @returns Estimated cost in USD
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const metadata = MODEL_METADATA[model];
  if (!metadata) {
    console.warn(`No pricing metadata for model: ${model}`);
    return 0;
  }

  const promptCost = (promptTokens / 1_000_000) * metadata.pricing.prompt;
  const completionCost = (completionTokens / 1_000_000) * metadata.pricing.completion;

  return promptCost + completionCost;
}

/**
 * Get model metadata
 */
export function getModelMetadata(model: string): ModelMetadata | undefined {
  return MODEL_METADATA[model];
}

// ===== PRESET PROMPTS (Compatible with GLM implementation) =====

export interface SummaryPromptConfig {
  systemPrompt: string;
  userPromptTemplate: (data: ReportDataForSummary) => string;
  maxTokens: number;
  temperature: number;
}
