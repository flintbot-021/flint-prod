import { NextRequest, NextResponse } from 'next/server'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  url: string
  userAgent?: string
}

interface WebVitalsData {
  CLS?: number
  FCP?: number
  FID?: number
  LCP?: number
  TTFB?: number
}

export async function POST(request: NextRequest) {
  try {
    const data: PerformanceMetric | WebVitalsData = await request.json()
    
    // Log performance metrics (in production, send to analytics service)
    console.log('Performance Metric:', {
      ...data,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent')
    })
    
    // In production, you might want to:
    // 1. Send to analytics service (Google Analytics, Mixpanel, etc.)
    // 2. Store in database for analysis
    // 3. Alert on performance degradation
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Performance tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to record performance metric' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return current performance status
  return NextResponse.json({
    status: 'monitoring',
    metrics: {
      server_uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      node_version: process.version,
      timestamp: new Date().toISOString()
    }
  })
} 