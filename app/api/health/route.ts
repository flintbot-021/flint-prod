import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/data-access/base'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Test database connection
    const supabase = await getSupabaseClient()
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    const responseTime = Date.now() - startTime
    
    const health = {
      status: dbError ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
      services: {
        database: {
          status: dbError ? 'down' : 'up',
          responseTime: `${responseTime}ms`,
          error: dbError?.message || null
        }
      },
      environment: process.env.NODE_ENV || 'development'
    }

    return NextResponse.json(health, {
      status: dbError ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    )
  }
} 