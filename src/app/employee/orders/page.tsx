'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { ProformaInvoiceModal } from '@/components/orders/ProformaInvoiceModal';
import { useAppStore } from '@/data/store';
import { Order, OrderStatus } from '@/types';
import { PlusCircle, Search, Filter, Clock, Building2, Eye, FileText, Receipt } from 'lucide-react';

export default function EmployeeOrdersPage() {
  const { orders, currentUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedProformaOrder, setSelectedProformaOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (selectedStatus !== 'ALL' && o.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.dealerName.toLowerCase().includes(q) ||
        (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Field Orders" subtitle="Tracking & Lifecycle" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Order Management</h2>
            <p className="text-xs text-[#6B7280]">
              Lifecycle progression from Draft to Admin Approval, ERP sync, and Completion
            </p>
          </div>

          <Link
            href="/employee/orders/new"
            className="inline-flex items-center justify-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Field Order</span>
          </Link>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order # (ORD-2026-1041), dealer name, or invoice..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['ALL', 'PENDING_ADMIN_APPROVAL', 'APPROVED', 'CONFIRMED', 'REJECTED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1.5 rounded-md font-mono text-[11px] whitespace-nowrap transition-all ${
                  selectedStatus === st
                    ? 'bg-[#111827] text-white font-semibold'
                    : 'bg-neutral-100 text-[#4B5563] hover:bg-neutral-200'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table / Cards */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-[#E5E7EB]">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-neutral-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="tech-code font-bold text-xs text-[#111827]">
                        {order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} />
                      {order.invoiceNumber && (
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {order.invoiceNumber}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-[#111827] mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                      {order.dealerName}
                    </h4>

                    <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                      {order.items.length} line items • Created {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100 gap-1.5">
                    <div className="font-mono font-bold text-sm text-[#111827]">
                      ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-emerald-700">
                        Est. Reward: +₹{order.rewardEstimated.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedProformaOrder(order)}
                        className="px-2 py-1 bg-white hover:bg-neutral-100 text-[#111827] border border-[#D1D5DB] rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <Receipt className="w-3.5 h-3.5 text-[#DC2626]" />
                        <span>Proforma</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[#6B7280]">
                No orders match your search criteria.
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Proforma Invoice Modal */}
      <ProformaInvoiceModal
        order={selectedProformaOrder}
        isOpen={!!selectedProformaOrder}
        onClose={() => setSelectedProformaOrder(null)}
      />
    </div>
  );
}
