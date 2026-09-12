import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { code: 'asc' }
    });

    const parsed = employees.map((e) => ({
      ...e,
      assignedDealerIds: e.assignedDealerIds ? JSON.parse(e.assignedDealerIds) : [],
      allowedPages: e.allowedPages ? JSON.parse(e.allowedPages) : []
    }));

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
