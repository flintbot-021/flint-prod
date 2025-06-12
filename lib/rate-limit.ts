import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (in production, use Redis or similar)
const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = config

  return async function rateLimit(
    request: NextRequest,
    identifier?: string
  ): Promise<{ success: boolean; response?: NextResponse }> {
    // Get identifier (IP address or custom identifier)
    const key = identifier || getClientIdentifier(request)
    const now = Date.now()
    
    // Initialize or get existing record
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      }
    }

    // Check if limit exceeded
    if (store[key].count >= maxRequests) {
      const resetTime = new Date(store[key].resetTime)
      
      return {
        success: false,
        response: NextResponse.json(
          { 
            error: message,
            retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': resetTime.toISOString(),
              'Retry-After': Math.ceil((store[key].resetTime - now) / 1000).toString()
            }
          }
        )
      }
    }

    // Increment counter
    store[key].count++

    return { success: true }
  }
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (for production behind proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  // Fallback to unknown if no IP found
  return 'unknown'
}

// Predefined rate limit configurations
export const rateLimits = {
  // Strict rate limiting for authentication endpoints
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.'
  }),
  
  // Moderate rate limiting for API endpoints
  api: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'API rate limit exceeded, please slow down.'
  }),
  
  // Lenient rate limiting for general requests
  general: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Rate limit exceeded, please try again later.'
  }),
  
  // Very strict for password reset
  passwordReset: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
    message: 'Too many password reset attempts, please try again later.'
  })
}

// Middleware wrapper for easy use in API routes
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  rateLimit: ReturnType<typeof createRateLimit>,
  identifier?: (req: NextRequest) => string
) {
  return async function (req: NextRequest) {
    const id = identifier ? identifier(req) : undefined
    const result = await rateLimit(req, id)
    
    if (!result.success && result.response) {
      return result.response
    }
    
    return handler(req)
  }
} 