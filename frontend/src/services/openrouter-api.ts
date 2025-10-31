/**
 * OpenRouter AI API Client Service
 *
 * Service for interacting with OpenRouter's unified AI API
 * Provides access to multiple state-of-the-art AI models through one API
 *
 * SECURITY NOTE: This implementation includes the API key in the frontend for demo purposes.
 * In production, this service should be moved to the backend to protect the API key.
 *
 * @see https://openrouter.ai/docs/api-reference
 */

import type {
  OpenRouterConfig,
  OpenRouterRequestParams,
  OpenRouterResponse,
  OpenRouterStreamChunk,
  OpenRouterError,
  AISummaryRequest,
  AISummaryResponse,
  ReportDataForSummary,
  OpenRouterModel,
} from '@/types/openrouter';
import { calculateCost } from '@/types/openrouter';
import type {
  ComprehensiveGuideData,
  ComprehensiveFeatureData,
  ComprehensivePageData,
  ComprehensiveReportData,
} from '@/types/enhanced-pendo';

// ===== CONFIGURATION =====

const DEFAULT_CONFIG: Required<Omit<OpenRouterConfig, 'apiKey' | 'appName' | 'appUrl'>> = {
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'anthropic/claude-3.5-sonnet', // Recommended model for analytics
  timeout: 30000, // 30 seconds
  maxRetries: 2,
};

/**
 * Get API key from environment variables
 *
 * SECURITY WARNING: API key is exposed in frontend code!
 *
 * TODO: Move this to backend environment variables:
 * 1. Create a backend endpoint: POST /api/ai/summary
 * 2. Store API key in backend .env file
 * 3. Update this service to call backend endpoint instead of OpenRouter API directly
 * 4. Add rate limiting and authentication to backend endpoint
 */
const getApiKey = (): string => {
  // Try to get from environment variables first
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!envKey) {
    console.warn('⚠️ VITE_OPENROUTER_API_KEY not found in environment variables');
    // Fallback to provided key (remove in production)
    return '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';
  }

  return envKey;
};

const API_KEY = getApiKey();

// Optional: App identification for OpenRouter rankings
const APP_NAME = import.meta.env.VITE_OPENROUTER_APP_NAME || 'Cin7 Pendo Analytics';
const APP_URL = import.meta.env.VITE_OPENROUTER_APP_URL || window.location.origin;

// Model selection from environment or default
const DEFAULT_MODEL = (import.meta.env.VITE_AI_MODEL as OpenRouterModel) || 'anthropic/claude-3.5-sonnet';

// ===== PROMPT TEMPLATES =====

const SYSTEM_PROMPT = `You are an expert data analyst specializing in product analytics and user behavior insights. Your role is to analyze Pendo analytics data and provide clear, actionable insights for product managers and executives.

Guidelines:
- Be concise yet comprehensive
- Highlight key trends and patterns
- Identify actionable recommendations
- Use clear, non-technical language
- Focus on business impact
- Structure insights logically with bullet points`;

const getReportPromptTemplate = (type: string, data: ReportDataForSummary): string => {
  const templates = {
    guides: `Analyze this Pendo Guide analytics data and provide:
1. Overall Performance Summary (2-3 sentences)
2. Key Insights (3-5 bullet points)
3. Recommendations (2-3 specific actions)

Guide: ${data.name}
Type: ${data.type}
Period: ${data.period?.start} to ${data.period?.end}

Metrics:
${formatMetrics(data.metrics)}

${data.trends ? `\nTrends:\n${formatTrends(data.trends)}` : ''}
${data.topInsights ? `\nTop Insights:\n${data.topInsights.map(i => `- ${i}`).join('\n')}` : ''}`,

    features: `Analyze this Pendo Feature usage data and provide:
1. Usage Summary (2-3 sentences)
2. Adoption Insights (3-5 bullet points)
3. Optimization Recommendations (2-3 specific actions)

Feature: ${data.name}
Type: ${data.type}
Period: ${data.period?.start} to ${data.period?.end}

Metrics:
${formatMetrics(data.metrics)}

${data.trends ? `\nTrends:\n${formatTrends(data.trends)}` : ''}`,

    pages: `Analyze this Pendo Page analytics data and provide:
1. Traffic & Engagement Summary (2-3 sentences)
2. User Behavior Insights (3-5 bullet points)
3. UX Improvement Recommendations (2-3 specific actions)

Page: ${data.name}
URL: ${data.metrics.url || 'N/A'}
Period: ${data.period?.start} to ${data.period?.end}

Metrics:
${formatMetrics(data.metrics)}

${data.trends ? `\nTrends:\n${formatTrends(data.trends)}` : ''}`,

    reports: `Analyze this Pendo Report engagement data and provide:
1. Report Usage Summary (2-3 sentences)
2. Engagement Insights (3-5 bullet points)
3. Content & Distribution Recommendations (2-3 specific actions)

Report: ${data.name}
Type: ${data.type}
Period: ${data.period?.start} to ${data.period?.end}

Metrics:
${formatMetrics(data.metrics)}

${data.trends ? `\nTrends:\n${formatTrends(data.trends)}` : ''}`,
  };

  return templates[type as keyof typeof templates] || templates.guides;
};

// ===== HELPER FUNCTIONS =====

function formatMetrics(metrics: Record<string, number | string>): string {
  return Object.entries(metrics)
    .map(([key, value]) => `- ${key}: ${formatValue(value)}`)
    .join('\n');
}

function formatValue(value: number | string): string {
  if (typeof value === 'number') {
    if (value > 1000) {
      return value.toLocaleString();
    }
    if (value % 1 !== 0) {
      return value.toFixed(2);
    }
    return value.toString();
  }
  return value;
}

function formatTrends(trends: Array<{ metric: string; direction: string; change: number }>): string {
  return trends
    .map(t => `- ${t.metric}: ${t.direction === 'up' ? '↑' : t.direction === 'down' ? '↓' : '→'} ${Math.abs(t.change)}%`)
    .join('\n');
}

/**
 * Compress report data to minimize token usage
 * Removes verbose fields and keeps only essential metrics
 */
function compressReportData(
  type: 'guides' | 'features' | 'pages' | 'reports',
  data: ComprehensiveGuideData | ComprehensiveFeatureData | ComprehensivePageData | ComprehensiveReportData
): ReportDataForSummary {
  const compressed: ReportDataForSummary = {
    id: data.id,
    name: data.name,
    type: type,
    metrics: {},
    period: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  };

  // Extract key metrics based on type
  switch (type) {
    case 'guides': {
      const guideData = data as ComprehensiveGuideData;
      compressed.metrics = {
        'Total Views': guideData.viewedCount,
        'Completions': guideData.completedCount,
        'Completion Rate': `${guideData.completionRate.toFixed(1)}%`,
        'Engagement Rate': `${guideData.engagementRate.toFixed(1)}%`,
        'Drop-off Rate': `${guideData.dropOffRate.toFixed(1)}%`,
        'Steps': guideData.stepCount,
        'State': guideData.state,
      };
      break;
    }

    case 'features': {
      const featureData = data as ComprehensiveFeatureData;
      compressed.metrics = {
        'Usage Count': featureData.usageCount,
        'Unique Users': featureData.uniqueUsers,
        'Adoption Rate': `${featureData.adoptionRate}%`,
        'Usage Frequency': `${featureData.usageFrequency}x/day`,
        'Retention Rate': `${featureData.retentionRate}%`,
        'Stickiness': `${featureData.stickinessIndex.toFixed(2)}`,
      };
      break;
    }

    case 'pages': {
      const pageData = data as ComprehensivePageData;
      compressed.metrics = {
        'Page Views': pageData.viewedCount,
        'Unique Visitors': pageData.uniqueVisitors,
        'Avg Time on Page': `${pageData.avgTimeOnPage}s`,
        'Bounce Rate': `${pageData.bounceRate.toFixed(1)}%`,
        'Exit Rate': `${pageData.exitRate.toFixed(1)}%`,
        'Conversion Rate': `${pageData.conversionRate.toFixed(1)}%`,
      };

      // Add frustration metrics if available
      if (pageData.frustrationMetrics) {
        compressed.metrics['Frustration Rate'] = `${pageData.frustrationMetrics.frustrationRate.toFixed(1)}%`;
        compressed.metrics['Total Frustration Events'] =
          pageData.frustrationMetrics.totalRageClicks +
          pageData.frustrationMetrics.totalDeadClicks +
          pageData.frustrationMetrics.totalUTurns +
          pageData.frustrationMetrics.totalErrorClicks;
      }
      break;
    }

    case 'reports': {
      const reportData = data as ComprehensiveReportData;
      compressed.metrics = {
        'Total Views': reportData.totalViews,
        'Unique Viewers': reportData.uniqueViewers,
        'Shares': reportData.shares,
        'Downloads': reportData.downloads,
        'Average Rating': reportData.averageRating,
        'Engagement Score': reportData.engagementScore,
        'Return Visitor Rate': `${reportData.returnVisitorRate}%`,
      };
      break;
    }
  }

  return compressed;
}

// ===== API CLIENT CLASS =====

class OpenRouterAPIClient {
  private config: Required<Omit<OpenRouterConfig, 'appName' | 'appUrl'>> & Partial<Pick<OpenRouterConfig, 'appName' | 'appUrl'>>;

  constructor(config?: Partial<OpenRouterConfig>) {
    this.config = {
      apiKey: config?.apiKey || API_KEY,
      appName: config?.appName || APP_NAME,
      appUrl: config?.appUrl || APP_URL,
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Make a request to OpenRouter API
   */
  private async request<T>(
    params: OpenRouterRequestParams,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    // Combine external signal with timeout signal
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      };

      // Add optional app identification headers for OpenRouter rankings
      if (this.config.appUrl) {
        headers['HTTP-Referer'] = this.config.appUrl;
      }
      if (this.config.appName) {
        headers['X-Title'] = this.config.appName;
      }

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: params.model || this.config.model,
          ...params,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: OpenRouterError = await response.json();
        throw new Error(
          `OpenRouter API Error: ${error.error.message} (Code: ${error.error.code})`
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout or cancelled');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Generate completion (non-streaming)
   */
  async complete(params: OpenRouterRequestParams): Promise<OpenRouterResponse> {
    return this.request<OpenRouterResponse>({ ...params, stream: false });
  }

  /**
   * Generate completion with streaming
   */
  async *stream(params: OpenRouterRequestParams): AsyncGenerator<OpenRouterStreamChunk> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      };

      if (this.config.appUrl) {
        headers['HTTP-Referer'] = this.config.appUrl;
      }
      if (this.config.appName) {
        headers['X-Title'] = this.config.appName;
      }

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: params.model || this.config.model,
          ...params,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error: OpenRouterError = await response.json();
        throw new Error(`OpenRouter API Error: ${error.error.message}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const chunk: OpenRouterStreamChunk = JSON.parse(data);
              yield chunk;
            } catch (e) {
              console.error('Failed to parse chunk:', e);
            }
          }
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Generate AI summary for Pendo report data
   */
  async generateSummary(request: AISummaryRequest): Promise<AISummaryResponse> {
    const startTime = Date.now();

    try {
      // Compress data to minimize tokens
      const compressedData = compressReportData(request.reportType, request.reportData as any);

      // Build prompt
      const userPrompt = getReportPromptTemplate(request.reportType, compressedData);

      // Use custom model if provided, otherwise use default
      const model = request.model || DEFAULT_MODEL;

      console.log(`🤖 Generating AI summary with model: ${model}`);

      // Make API request
      const response = await this.complete({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content;

      // Parse response to extract insights and recommendations
      const sections = this.parseResponse(content);

      // Calculate cost
      const costEstimate = calculateCost(
        response.model,
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );

      return {
        summary: sections.summary,
        insights: sections.insights,
        recommendations: sections.recommendations,
        metadata: {
          model: response.model,
          provider: response.provider,
          tokensUsed: response.usage.total_tokens,
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          costEstimate,
        },
      };
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      return {
        summary: '',
        insights: [],
        recommendations: [],
        metadata: {
          model: request.model || DEFAULT_MODEL,
          tokensUsed: 0,
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate AI summary with streaming
   */
  async *generateSummaryStream(request: AISummaryRequest): AsyncGenerator<{
    content: string;
    done: boolean;
  }> {
    try {
      const compressedData = compressReportData(request.reportType, request.reportData as any);
      const userPrompt = getReportPromptTemplate(request.reportType, compressedData);
      const model = request.model || DEFAULT_MODEL;

      let fullContent = '';

      for await (const chunk of this.stream({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000,
      })) {
        const delta = chunk.choices[0]?.delta?.content || '';
        fullContent += delta;

        yield {
          content: fullContent,
          done: chunk.choices[0]?.finish_reason === 'stop',
        };
      }
    } catch (error) {
      console.error('Streaming error:', error);
      yield {
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        done: true,
      };
    }
  }

  /**
   * Parse AI response to extract structured insights
   */
  private parseResponse(content: string): {
    summary: string;
    insights: string[];
    recommendations: string[];
  } {
    const lines = content.split('\n').filter(line => line.trim());

    let summary = '';
    const insights: string[] = [];
    const recommendations: string[] = [];

    let currentSection: 'summary' | 'insights' | 'recommendations' = 'summary';

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect section headers
      if (trimmed.match(/^(##?\s*)?(Performance|Usage|Traffic|Report)\s+Summary/i)) {
        currentSection = 'summary';
        continue;
      }
      if (trimmed.match(/^(##?\s*)?(Key\s+)?Insights/i)) {
        currentSection = 'insights';
        continue;
      }
      if (trimmed.match(/^(##?\s*)?Recommendations/i)) {
        currentSection = 'recommendations';
        continue;
      }

      // Skip empty lines and section headers
      if (!trimmed || trimmed.match(/^(#{1,6}|\d+\.)\s*$/)) {
        continue;
      }

      // Extract bullet points
      const bulletMatch = trimmed.match(/^[-*•]\s*(.+)$/);
      const numberedMatch = trimmed.match(/^\d+\.\s*(.+)$/);

      const cleanLine = bulletMatch?.[1] || numberedMatch?.[1] || trimmed;

      // Add to appropriate section
      if (currentSection === 'summary') {
        summary += (summary ? ' ' : '') + cleanLine;
      } else if (currentSection === 'insights' && (bulletMatch || numberedMatch)) {
        insights.push(cleanLine);
      } else if (currentSection === 'recommendations' && (bulletMatch || numberedMatch)) {
        recommendations.push(cleanLine);
      }
    }

    return { summary, insights, recommendations };
  }
}

// ===== SINGLETON INSTANCE =====

export const openRouterAPI = new OpenRouterAPIClient();

// ===== EXPORTS =====

export { OpenRouterAPIClient };
export type { AISummaryRequest, AISummaryResponse };
