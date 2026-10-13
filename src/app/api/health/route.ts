import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'CONNECTED';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error: any) {
    dbStatus = 'DISCONNECTED';
    console.error('Healthcheck DB connection failure:', error);
    return NextResponse.json(
      {
        status: 'DEGRADED',
        database: dbStatus,
        error: 'Database ping failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }

  const memoryUsage = process.memoryUsage();

  return NextResponse.json({
    status: 'HEALTHY',
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs
    },
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryHeapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      nodeVersion: process.version
    },
    latencyMs: Date.now() - startTime,
    timestamp: new Date().toISOString()
  });
}
