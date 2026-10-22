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

    // Dealers are strictly forbidden from accessing internal employee data
    if (session.role === 'DEALER') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Dealers cannot access employee directory.' },
        { status: 403 }
      );
    }

    const employees = await prisma.employee.findMany({
      orderBy: { code: 'asc' }
    });

    const parsed = employees.map((e) => {
      const { password: _p, ...safeEmployee } = e;
      const canViewSalary =
        session.role === 'ADMIN' ||
        session.userId === e.id ||
        session.userId === `user-${e.id}` ||
        session.employeeCode === e.code;

      return {
        ...safeEmployee,
        baseSalary: canViewSalary ? safeEmployee.baseSalary : null,
        assignedDealerIds: safeEmployee.assignedDealerIds ? JSON.parse(safeEmployee.assignedDealerIds) : [],
        allowedPages: safeEmployee.allowedPages ? JSON.parse(safeEmployee.allowedPages) : []
      };
    });

    return NextResponse.json({
      success: true,
      employees: parsed
    });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
