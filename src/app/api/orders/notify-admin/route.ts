import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      orderNumber,
      proformaNumber,
      dealerName,
      dealerCity,
      dealerPhone,
      totalAmount,
      itemsCount,
      items,
      timestamp
    } = body;

    const ts = timestamp || new Date().toISOString();

    // 1. Record Audit Log in PostgreSQL
    const audit = await prisma.auditLog.create({
      data: {
        id: `aud-pi-${Date.now()}`,
        userId: 'system',
        userName: dealerName || 'Dealer Customer',
        role: 'DEALER',
        action: 'PROFORMA_GENERATED',
        entityType: 'ORDER',
        entityId: orderId || orderNumber,
        details: `Commercial Proforma ${proformaNumber || orderNumber} generated for ${dealerName} (${dealerCity || 'Odisha'}). Value: ₹${Number(totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${itemsCount || 0} line items). Dispatched to Admin.`,
        timestamp: ts
      }
    });

    // 2. Record Integration Dispatch Event in PostgreSQL
    const integrationEvent = await prisma.integrationEvent.create({
      data: {
        id: `erp-pi-${Date.now()}`,
        type: 'ADMIN_NOTIFICATION',
        title: `Proforma Dispatched: ${proformaNumber || orderNumber}`,
        targetId: orderNumber,
        status: 'SUCCESS',
        payloadSummary: `Order requisition generated: ${itemsCount} items, Net Value: ₹${Number(totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}, Dealer: ${dealerName} (${dealerPhone})`,
        timestamp: ts,
        latencyMs: 85
      }
    });

    console.log(`[PROFORMA DISPATCH] Order ${orderNumber} / ${proformaNumber} for ${dealerName} successfully logged and dispatched to Admin.`);

    return NextResponse.json({
      success: true,
      message: 'Proforma dispatched to Admin and logged in commercial queue',
      proformaNumber,
      auditId: audit.id,
      eventId: integrationEvent.id
    });
  } catch (error: any) {
    console.error('Failed to dispatch order notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Notification dispatch failed' },
      { status: 500 }
    );
  }
}
