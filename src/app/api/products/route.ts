import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const material = searchParams.get('material');

    const where: any = { isArchived: false };
    if (category && category !== 'all') {
      where.category = category;
    }
    if (material && material !== 'all') {
      where.material = material;
    }

    const products = await prisma.product.findMany({
      where,
      include: { variants: true },
      orderBy: { code: 'asc' }
    });

    const parsed = products.map((p) => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : []
    }));

    return NextResponse.json({
      success: true,
      count: parsed.length,
      products: parsed
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
