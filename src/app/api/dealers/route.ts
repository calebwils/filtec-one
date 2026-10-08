import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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
