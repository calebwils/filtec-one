import { Order } from '@/types';

export interface IERPAdapter {
  syncOrderToERP(order: Order): Promise<{ success: boolean; erpReferenceId: string; invoiceNumber: string; latencyMs: number }>;
  syncProductCatalog(): Promise<{ lastSynced: string; productCount: number }>;
  checkHealth(): Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'DOWN'; latencyMs: number }>;
}

export class MockERPAdapter implements IERPAdapter {
  async syncOrderToERP(order: Order): Promise<{ success: boolean; erpReferenceId: string; invoiceNumber: string; latencyMs: number }> {
    // Simulate real ERP API call latency (100-250ms)
    await new Promise((resolve) => setTimeout(resolve, 150));

    const invoiceNum = `INV-FIL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const erpRef = `ERP-ORD-${order.orderNumber.replace('ORD-', '')}`;

    return {
      success: true,
      erpReferenceId: erpRef,
      invoiceNumber: invoiceNum,
      latencyMs: 142
    };
  }

  async syncProductCatalog(): Promise<{ lastSynced: string; productCount: number }> {
    return {
      lastSynced: new Date().toISOString(),
      productCount: 99
    };
  }

  async checkHealth(): Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'DOWN'; latencyMs: number }> {
    return {
      status: 'HEALTHY',
      latencyMs: 34
    };
  }
}

// Singleton adapter instance
export const ERPService: IERPAdapter = new MockERPAdapter();
