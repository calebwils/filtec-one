import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/security';

export const dynamic = 'force-dynamic';

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function GET(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid session required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employee_id') || searchParams.get('employeeId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Missing employee_id parameter.' },
        { status: 400 }
      );
    }

    // Authorization: Admin can view any, Employee can view their own
    const isEmployeeSelf =
      session.userId === employeeId ||
      session.employeeCode === employeeId ||
      session.userId === `user-${employeeId}`;

    if (session.role !== 'ADMIN' && !isEmployeeSelf) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions to view this employee route.' },
        { status: 403 }
      );
    }

    // 1. Fetch employee details
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ id: employeeId }, { code: employeeId }]
      },
      select: {
        id: true,
        code: true,
        name: true,
        phone: true,
        designation: true,
        territory: true,
        avatarUrl: true
      }
    });

    // 2. Fetch location logs for the requested date
    const logs = await (prisma as any).locationLog.findMany({
      where: {
        employeeId: employee ? employee.id : employeeId,
        date: date
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // 3. Fetch check-in/out attendance records for additional context (e.g. photos)
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        employeeId: employee ? employee.id : employeeId,
        timestamp: {
          gte: dayStart,
          lte: dayEnd
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    // Merge or enrich points
    const points = logs.map((log: any) => {
      let parsedMeta = null;
      if (log.metadata) {
        try {
          parsedMeta = JSON.parse(log.metadata);
        } catch {
          parsedMeta = { raw: log.metadata };
        }
      }

      return {
        id: log.id,
        latitude: log.latitude,
        longitude: log.longitude,
        accuracy: log.accuracy,
        speed: log.speed,
        heading: log.heading,
        batteryLevel: log.batteryLevel,
        eventType: log.eventType,
        locationName: log.locationName,
        metadata: parsedMeta,
        timestamp: log.timestamp.toISOString(),
        timeStr: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    });

    // Compute route statistics
    let totalDistanceMeters = 0;
    const stops: Array<{
      latitude: number;
      longitude: number;
      locationName?: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      eventType: string;
      metadata?: any;
    }> = [];

    for (let i = 0; i < points.length; i++) {
      if (i > 0) {
        const prev = points[i - 1];
        const curr = points[i];
        const dist = haversineDistanceMeters(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
        totalDistanceMeters += dist;

        const timeDiffMs = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
        const timeDiffMin = Math.round(timeDiffMs / (1000 * 60));

        // Detect stop if distance moved is < 60 meters and duration >= 10 minutes, or explicit stop/visit
        if (dist < 60 && timeDiffMin >= 10) {
          stops.push({
            latitude: curr.latitude,
            longitude: curr.longitude,
            locationName: curr.locationName || prev.locationName,
            startTime: prev.timeStr,
            endTime: curr.timeStr,
            durationMinutes: timeDiffMin,
            eventType: curr.eventType || 'stop',
            metadata: curr.metadata
          });
        }
      }

      // Also register explicit client visits or check-ins as key milestone stops
      if (points[i].eventType === 'client_visit') {
        stops.push({
          latitude: points[i].latitude,
          longitude: points[i].longitude,
          locationName: points[i].locationName,
          startTime: points[i].timeStr,
          endTime: points[i].timeStr,
          durationMinutes: 0,
          eventType: 'client_visit',
          metadata: points[i].metadata
        });
      }
    }

    const firstPoint = points[0] || null;
    const lastPoint = points.length > 0 ? points[points.length - 1] : null;

    return NextResponse.json({
      success: true,
      employee: employee || { id: employeeId, name: 'Agent' },
      date,
      summary: {
        totalPoints: points.length,
        totalDistanceMeters: Math.round(totalDistanceMeters),
        totalDistanceKm: Number((totalDistanceMeters / 1000).toFixed(2)),
        startTime: firstPoint ? firstPoint.timeStr : null,
        endTime: lastPoint ? lastPoint.timeStr : null,
        stopsCount: stops.length,
        hasCheckIn: attendanceRecords.some((r) => r.type === 'CHECK_IN'),
        hasCheckOut: attendanceRecords.some((r) => r.type === 'CHECK_OUT')
      },
      points,
      stops,
      attendancePunches: attendanceRecords
    });
  } catch (error: any) {
    console.error('Error fetching employee route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
