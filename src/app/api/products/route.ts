import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sortProductsNaturally } from '@/lib/catalogueUtils';

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
      include: { variants: true }
    });

    const parsed = products.map((p) => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : []
    }));

    const sortedProducts = sortProductsNaturally(parsed);

    return NextResponse.json({
      success: true,
      count: sortedProducts.length,
      products: sortedProducts
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
