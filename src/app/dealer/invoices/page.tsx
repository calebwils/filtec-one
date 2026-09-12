'use client';

import React from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore } from '@/data/store';
import { FileText, Download, CheckCircle2 } from 'lucide-react';

export default function DealerInvoicesPage() {
  const { orders, dealers, currentUser } = useAppStore();
  const currentDealer = dealers.find((d) => d.id === currentUser.dealerId) || dealers[0];

  const invoicedOrders = orders.filter(
    (o) => o.dealerId === currentDealer.id && (o.invoiceNumber || o.status === 'CONFIRMED' || o.status === 'INVOICED')
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Billing Invoices" subtitle={currentDealer.name} />
      <DesktopSubNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Financial Invoices</h2>
          <p className="text-xs text-[#6B7280]">
            Official tax invoices issued by FILTEC Polyplast accounting & billing authority
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-[#E5E7EB]">
            {invoicedOrders.length > 0 ? (
              invoicedOrders.map((order) => (
                <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-[#111827] shrink-0 font-mono">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="tech-code font-bold text-xs text-[#111827]">
                          {order.invoiceNumber || `INV-FIL-${order.orderNumber.replace('ORD-2026-', '')}`}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          ERP Synced
                        </span>
                      </div>
                      <div className="text-[#4B5563] mt-1 font-mono">
                        Ref Order: {order.orderNumber} • Date: {new Date(order.confirmedAt || order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100">
                    <div className="font-mono font-bold text-sm text-[#111827]">
                      ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`Downloading Invoice PDF: ${order.invoiceNumber || 'INV-FIL-2026-8821'}`)}
                      className="text-[11px] text-[#DC2626] hover:underline font-semibold flex items-center gap-1 mt-0.5"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[#6B7280]">
                No invoices generated yet.
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
