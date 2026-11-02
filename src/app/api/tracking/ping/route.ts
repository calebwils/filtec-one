import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/security';

export const dynamic = 'force-dynamic';

export interface PingPayload {
  id?: string;
  employeeId: string;
  employeeName?: string;
  date?: string; // YYYY-MM-DD
  timestamp?: string; // ISO string
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  eventType?: 'ping_routine' | 'check_in' | 'check_out' | 'client_visit' | 'stop';
  locationName?: string;
  metadata?: any;
}

export async function POST(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid session required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const rawPings: PingPayload[] = Array.isArray(body.pings) ? body.pings : [body];

    if (!rawPings.length) {
      return NextResponse.json(
        { success: false, error: 'Missing ping data.' },
        { status: 400 }
      );
    }

    const validPings = rawPings.filter(
      (p) =>
        p &&
        typeof p.latitude === 'number' &&
        typeof p.longitude === 'number' &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude) &&
        p.latitude >= -90 &&
        p.latitude <= 90 &&
        p.longitude >= -180 &&
        p.longitude <= 180
    );

    if (!validPings.length) {
      return NextResponse.json(
        { success: false, error: 'No valid GPS coordinates provided.' },
        { status: 400 }
      );
    }

    const recordsToInsert = validPings.map((p) => {
      const ts = p.timestamp ? new Date(p.timestamp) : new Date();
      const dateStr = p.date || ts.toISOString().split('T')[0];
      const targetEmpId = p.employeeId || session.userId;

      return {
        id: p.id || crypto.randomUUID(),
        employeeId: targetEmpId,
        employeeName: p.employeeName || session.name || null,
        date: dateStr,
        timestamp: ts,
        latitude: p.latitude,
        longitude: p.longitude,
        accuracy: typeof p.accuracy === 'number' ? p.accuracy : null,
        speed: typeof p.speed === 'number' ? p.speed : null,
        heading: typeof p.heading === 'number' ? p.heading : null,
        batteryLevel: typeof p.batteryLevel === 'number' ? p.batteryLevel : null,
        eventType: p.eventType || 'ping_routine',
        locationName: p.locationName || null,
        metadata: p.metadata ? (typeof p.metadata === 'string' ? p.metadata : JSON.stringify(p.metadata)) : null
      };
    });

    // Ingest into database
    await (prisma as any).locationLog.createMany({
      data: recordsToInsert,
      skipDuplicates: true
    });

    // Update last known location on Employee for the latest ping
    const latestPing = recordsToInsert[recordsToInsert.length - 1];
    if (latestPing && latestPing.employeeId) {
      try {
        const lastLocationStr = latestPing.locationName || `${latestPing.latitude.toFixed(5)}, ${latestPing.longitude.toFixed(5)}`;
        await prisma.employee.updateMany({
          where: {
            OR: [
              { id: latestPing.employeeId },
              { code: latestPing.employeeId }
            ]
          },
          data: {
            lastLocation: lastLocationStr
          }
        });
      } catch (err) {
        // Non-blocking if employee record is not found
        console.warn('Could not update employee lastLocation:', err);
      }
    }

    return NextResponse.json({
      success: true,
      insertedCount: recordsToInsert.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error handling tracking ping:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
