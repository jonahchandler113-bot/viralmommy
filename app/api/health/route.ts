import { NextResponse } from 'next/server'

/**
 * Health Check Endpoint
 * Used by Railway and monitoring services to verify application health
 */
export async function GET() {
  const checks = {
    api: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  }

  // TODO: Add database check when Prisma is set up
  // try {
  //   await prisma.$queryRaw`SELECT 1`
  //   checks.database = true
  // } catch (error) {
  //   checks.database = false
  // }

  // TODO: Add Redis check when Redis client is set up
  // try {
  //   await redis.ping()
  //   checks.redis = true
  // } catch (error) {
  //   checks.redis = false
  // }

  const isHealthy = checks.api

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      checks,
      version: process.env.npm_package_version || '0.1.0'
    },
    { status: isHealthy ? 200 : 503 }
  )
}
