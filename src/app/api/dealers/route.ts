import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid session required.' },
        { status: 401 }
      );
    }

    // DEALER role: Only access their own dealership data
    if (session.role === 'DEALER') {
      const dealerId = session.dealerId || session.userId.replace(/^user-/, '');
      const dealer = await prisma.dealer.findFirst({
        where: {
          OR: [
            { id: dealerId },
            ...(session.phone ? [{ phone: session.phone }] : [])
          ]
        }
      });
      if (!dealer) {
        return NextResponse.json({ success: true, dealers: [] });
      }
      const { password: _p, ...safeDealer } = dealer;
      return NextResponse.json({ success: true, dealers: [safeDealer] });
    }

    // EMPLOYEE role: Access assigned dealers
    if (session.role === 'EMPLOYEE') {
      const cleanEmpId = session.userId.replace(/^user-/, '');
      const emp = await prisma.employee.findFirst({
        where: {
          OR: [
            { id: cleanEmpId },
            ...(session.employeeCode ? [{ code: session.employeeCode }] : []),
            ...(session.phone ? [{ phone: session.phone }] : [])
          ]
        }
      });

      let assignedIds: string[] = [];
      if (emp?.assignedDealerIds) {
        try {
          assignedIds = JSON.parse(emp.assignedDealerIds);
        } catch {}
      }

      const whereClause = assignedIds.length > 0
        ? {
            OR: [
              { id: { in: assignedIds } },
              ...(emp ? [{ assignedRepId: emp.id }] : [])
            ]
          }
        : {};

      const dealers = await prisma.dealer.findMany({
        where: whereClause,
        orderBy: { name: 'asc' }
      });
      const sanitizedDealers = dealers.map(({ password: _p, ...safeDealer }) => safeDealer);
      return NextResponse.json({ success: true, dealers: sanitizedDealers });
    }

    // ADMIN: full directory
    const dealers = await prisma.dealer.findMany({
      orderBy: { name: 'asc' }
    });

    const sanitizedDealers = dealers.map(({ password: _p, ...safeDealer }) => safeDealer);

    return NextResponse.json({
      success: true,
      dealers: sanitizedDealers
    });
  } catch (error: any) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dealers' },
      { status: 500 }
    );
  }
}
