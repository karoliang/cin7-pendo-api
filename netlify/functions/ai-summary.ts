/**
 * Netlify Function: AI Summary Generator
 *
 * Secure serverless proxy for OpenRouter API
 * Keeps API key hidden from client-side code
 *
 * @see https://docs.netlify.com/functions/overview/
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Rate limiting map (in-memory, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Configuration
const CONFIG = {
  OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
  RATE_LIMIT_MAX: 100, // requests per hour per IP
  RATE_LIMIT_WINDOW: 60 * 60 * 1000, // 1 hour in ms
  REQUEST_TIMEOUT: 30000, // 30 seconds
};

/**
 * Rate limiting check
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Reset if window expired
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + CONFIG.RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: CONFIG.RATE_LIMIT_MAX - 1 };
  }

  // Check limit
  if (record.count >= CONFIG.RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count
  record.count++;
  return { allowed: true, remaining: CONFIG.RATE_LIMIT_MAX - record.count };
}

/**
 * Main handler
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Get client IP for rate limiting
    const clientIp = event.headers['x-forwarded-for']?.split(',')[0] ||
                     event.headers['client-ip'] ||
                     'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return {
        statusCode: 429,
        headers: {
          ...headers,
          'X-RateLimit-Limit': String(CONFIG.RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
          'Retry-After': '3600',
        },
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again in 1 hour.',
        }),
      };
    }

    // Get API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured in Netlify environment');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Configuration Error',
          message: 'AI service not configured. Please contact support.',
        }),
      };
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        }),
      };
    }

    // Validate required fields
    if (!requestBody.model || !requestBody.messages) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields',
          message: 'Request must include "model" and "messages" fields',
        }),
      };
    }

    // Log request (sanitized)
    console.log('AI Summary Request:', {
      model: requestBody.model,
      messagesCount: requestBody.messages?.length,
      ip: clientIp,
      timestamp: new Date().toISOString(),
    });

    // Call OpenRouter API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

    try {
      const response = await fetch(
        `${CONFIG.OPENROUTER_BASE_URL}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.URL || 'https://cin7-pendo-analytics.netlify.app',
            'X-Title': 'Cin7 Pendo Analytics Dashboard',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      // Get response body
      const responseData = await response.json();

      // Check for API errors
      if (!response.ok) {
        console.error('OpenRouter API error:', {
          status: response.status,
          error: responseData,
        });

        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({
            error: 'AI API Error',
            message: responseData.error?.message || 'Failed to generate AI summary',
            details: responseData,
          }),
        };
      }

      // Log success
      console.log('AI Summary Success:', {
        model: requestBody.model,
        tokensUsed: responseData.usage?.total_tokens,
        ip: clientIp,
      });

      // Return successful response
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'X-RateLimit-Limit': String(CONFIG.RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
        body: JSON.stringify(responseData),
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Request timeout');
        return {
          statusCode: 504,
          headers,
          body: JSON.stringify({
            error: 'Timeout',
            message: 'AI request took too long. Please try again.',
          }),
        };
      }

      throw fetchError;
    }

  } catch (error) {
    console.error('Unexpected error in ai-summary function:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
