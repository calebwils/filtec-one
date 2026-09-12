import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sortProductsNaturally } from '@/lib/catalogueUtils';

export async function GET() {
  try {
    const [
      products,
      dealers,
      employees,
      plumbers,
      orders,
      settingsRows,
      leaveRequests,
      dailyAttendance,
      rewardLedger,
      auditLogs,
      integrationEvents,
      users
    ] = await Promise.all([
      prisma.product.findMany({
        include: { variants: true }
      }),
      prisma.dealer.findMany({ orderBy: { code: 'asc' } }),
      prisma.employee.findMany({ orderBy: { code: 'asc' } }),
      prisma.plumber.findMany({ orderBy: { name: 'asc' } }),
      prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.appSetting.findMany(),
      prisma.leaveRequest.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.dailyAttendanceSummary.findMany({ orderBy: { date: 'desc' } }),
      prisma.rewardTransaction.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 100 }),
      prisma.integrationEvent.findMany({ orderBy: { timestamp: 'desc' }, take: 100 }),
      prisma.user.findMany()
    ]);

    // Parse JSON fields into proper JS objects/arrays
    const parsedProducts = sortProductsNaturally(
      products.map((p) => ({
        ...p,
        tags: p.tags ? JSON.parse(p.tags) : []
      }))
    );

    const parsedEmployees = employees.map((e) => ({
      ...e,
      assignedDealerIds: e.assignedDealerIds ? JSON.parse(e.assignedDealerIds) : [],
      allowedPages: e.allowedPages ? JSON.parse(e.allowedPages) : []
    }));

    const parsedUsers = users.map((u) => ({
      ...u,
      allowedPages: u.allowedPages ? JSON.parse(u.allowedPages) : []
    }));

    const parsedDailyAttendance = dailyAttendance.map((d) => ({
      ...d,
      checkIn: d.checkInJson ? JSON.parse(d.checkInJson) : undefined,
      checkOut: d.checkOutJson ? JSON.parse(d.checkOutJson) : undefined
    }));

    const settingsMap: Record<string, any> = {};
    for (const s of settingsRows) {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        products: parsedProducts,
        dealers,
        employees: parsedEmployees,
        users: parsedUsers,
        plumbers,
        orders,
        settings: settingsMap,
        leaveRequests,
        dailyAttendance: parsedDailyAttendance,
        rewardLedger,
        auditLogs,
        integrationEvents
      }
    });
  } catch (error: any) {
    console.error('API /api/data error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to query database' },
      { status: 500 }
    );
  }
}

// Handler to persist changes directly to PostgreSQL
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case 'UPDATE_EMPLOYEE': {
        const { id, systemRole, allowedPages, ...rest } = payload;
        const updated = await prisma.employee.update({
          where: { id },
          data: {
            ...rest,
            systemRole: systemRole !== undefined ? systemRole : undefined,
            allowedPages: allowedPages ? JSON.stringify(allowedPages) : undefined
          }
        });

        // Also sync User record if matching phone/code exists
        if (updated.phone) {
          await prisma.user.updateMany({
            where: { phone: updated.phone },
            data: {
              role: updated.systemRole,
              allowedPages: updated.allowedPages
            }
          });
        }
        return NextResponse.json({ success: true, employee: updated });
      }

      case 'CREATE_EMPLOYEE': {
        const { id, code, name, phone, systemRole, allowedPages, ...rest } = payload;
        const created = await prisma.employee.create({
          data: {
            id,
            code,
            name,
            phone,
            systemRole: systemRole || 'EMPLOYEE',
            allowedPages: allowedPages ? JSON.stringify(allowedPages) : '[]',
            ...rest
          }
        });
        return NextResponse.json({ success: true, employee: created });
      }

      case 'UPDATE_DEALER': {
        const { id, ...data } = payload;
        const updated = await prisma.dealer.update({
          where: { id },
          data
        });
        return NextResponse.json({ success: true, dealer: updated });
      }

      case 'UPDATE_PLUMBER': {
        const { id, ...data } = payload;
        const updated = await prisma.plumber.update({
          where: { id },
          data
        });
        return NextResponse.json({ success: true, plumber: updated });
      }

      case 'CREATE_PLUMBER': {
        const created = await prisma.plumber.create({
          data: payload
        });
        return NextResponse.json({ success: true, plumber: created });
      }

      case 'UPDATE_PRODUCT': {
        const { id, tags, variants, ...data } = payload;
        const updated = await prisma.product.update({
          where: { id },
          data: {
            ...data,
            tags: tags ? JSON.stringify(tags) : undefined
          }
        });
        return NextResponse.json({ success: true, product: updated });
      }

      case 'TOGGLE_PRODUCT_STOCK': {
        const { productId, inStock } = payload;
        const updated = await prisma.product.update({
          where: { id: productId },
          data: { inStock }
        });
        await prisma.productVariant.updateMany({
          where: { productId },
          data: { inStock }
        });
        return NextResponse.json({ success: true, product: updated });
      }

      case 'CREATE_PRODUCT': {
        const { variants, tags, ...prodData } = payload;
        const created = await prisma.product.create({
          data: {
            ...prodData,
            tags: tags ? JSON.stringify(tags) : '[]',
            variants: variants && variants.length > 0 ? {
              create: variants.map((v: any) => ({
                id: v.id,
                length: v.length || null,
                size: v.size || null,
                mrp: v.mrp || 0,
                packingQty: v.packingQty || 1,
                packingUnit: v.packingUnit || 'Pcs',
                inStock: v.inStock !== false
              }))
            } : undefined
          },
          include: { variants: true }
        });
        return NextResponse.json({ success: true, product: created });
      }

      case 'DELETE_PRODUCT': {
        const { productId } = payload;
        await prisma.product.delete({
          where: { id: productId }
        });
        return NextResponse.json({ success: true });
      }

      case 'UPDATE_SETTINGS': {
        const { key, value } = payload;
        const updated = await prisma.appSetting.upsert({
          where: { key },
          update: { value: JSON.stringify(value) },
          create: { key, value: JSON.stringify(value) }
        });
        return NextResponse.json({ success: true, setting: updated });
      }

      case 'CREATE_ORDER': {
        const { items, ...orderData } = payload;
        const created = await prisma.order.create({
          data: {
            ...orderData,
            items: {
              create: items.map((it: any) => ({
                id: it.id,
                productId: it.productId,
                productCode: it.productCode,
                productName: it.productName,
                variantId: it.variantId,
                variantDescription: it.variantDescription,
                unitPrice: it.unitPrice,
                quantity: it.quantity,
                packingQty: it.packingQty,
                packingUnit: it.packingUnit,
                totalAmount: it.totalAmount
              }))
            }
          },
          include: { items: true }
        });
        return NextResponse.json({ success: true, order: created });
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('API /api/data POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
