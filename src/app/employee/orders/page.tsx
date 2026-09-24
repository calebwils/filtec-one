'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { useAppStore } from '@/data/store';
import { Order, OrderStatus } from '@/types';
import {
  PlusCircle,
  Search,
  Filter,
  Clock,
  Building2,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  X
} from 'lucide-react';

export default function EmployeeOrdersPage() {
  const { orders, currentUser, settings } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';

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

  const getWhatsAppMessageText = (order: Order) => {
    const itemsList = (order.items || [])
      .map(
        (item, idx) =>
          `${idx + 1}. *${item.productName}* (${item.productCode})\n   • Spec: ${item.variantDescription}\n   • Quantity: *${item.quantity} ${item.packingUnit || 'Pcs'}*`
      )
      .join('\n\n');

    return (
      `*FILTEC ONE — ORDER REQUISITION*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Order No:* ${order.orderNumber}\n` +
      `🏢 *Dealer:* ${order.dealerName}\n` +
      `📍 *Location:* ${order.dealerCity}\n` +
      `📞 *Phone:* ${order.dealerPhone}\n` +
      `👤 *Field Staff:* ${order.employeeName}\n` +
      `📅 *Date:* ${new Date(order.createdAt).toLocaleDateString('en-IN')}\n\n` +
      `📦 *ORDERED PRODUCTS & QUANTITIES:*\n` +
      `${itemsList}\n\n` +
      (order.notes ? `📝 *Dispatch Notes:* ${order.notes}\n\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*FILTEC Polyplast Pvt. Ltd.* — Order Requisition`
    );
  };

  const handleCopyWhatsApp = (order: Order) => {
    const text = getWhatsAppMessageText(order);
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };

  const rawAdminPhone = settings?.company?.supportWhatsApp || '+91 9437505814';
  const adminPhoneDigits = rawAdminPhone.replace(/\D/g, '') || '919437505814';
  const cleanAdminPhone = adminPhoneDigits.length === 10 ? `91${adminPhoneDigits}` : adminPhoneDigits;
  const adminPhoneDisplay = '+91 ' + adminPhoneDigits.replace(/^91(?=\d{10})/, '');

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Field Orders" subtitle="Tracking & WhatsApp Dispatch" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Order Management</h2>
            <p className="text-xs text-[#6B7280]">
              Lifecycle progression from Submission to Admin Approval and WhatsApp Requisition
            </p>
          </div>

          <Link
            href="/employee/orders/new"
            className="inline-flex items-center justify-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Order Requisition</span>
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, dealer name (e.g. Balaji, Kendrapara)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'SUBMITTED', 'APPROVED', 'DISPATCHED', 'DELIVERED'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-all ${
                  selectedStatus === status
                    ? 'bg-[#111827] text-white font-semibold'
                    : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-neutral-200'
                }`}
              >
                {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-[#E5E7EB]">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const totalUnits = order.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
                return (
                  <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#F9FAFB] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-[#111827] shrink-0 font-mono text-xs font-bold">
                        {order.orderNumber.replace('ORD-2026-', '#')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#111827] font-mono">
                            {order.orderNumber}
                          </span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="text-[#111827] font-semibold mt-0.5 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{order.dealerName}</span>
                          <span className="text-neutral-400 font-normal">({order.dealerCity})</span>
                        </div>
                        <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                          {order.items?.length || 0} Products • {totalUnits} Units • Rep: {order.employeeName} • {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100 gap-1.5">
                      {isAdmin ? (
                        <>
                          <div className="font-mono font-bold text-sm text-[#111827]">
                            ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-emerald-700">
                              Est. Reward: +₹{order.rewardEstimated.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="px-2 py-1 bg-white hover:bg-neutral-100 text-[#111827] border border-[#D1D5DB] rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono font-semibold text-xs text-[#111827] block">
                              {totalUnits} Units Booked
                            </span>
                            <span className="text-[10px] text-emerald-700 font-medium">
                              {order.items?.length || 0} Products
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1.5 bg-[#111827] hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-[#6B7280]">
                No orders match your search criteria.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* WhatsApp Requisition Modal (NO PRICES) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 text-left my-auto max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div>
                <h3 className="font-bold text-base text-[#111827]">
                  Order Requisition Summary
                </h3>
                <span className="text-xs font-mono font-bold text-[#DC2626]">
                  {selectedOrder.orderNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 bg-neutral-50 rounded-xl p-3 border border-[#E5E7EB] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Dealer Partner:</span>
                <span className="font-bold text-[#111827]">{selectedOrder.dealerName} ({selectedOrder.dealerCity})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Dealer Phone:</span>
                <span className="font-mono text-[#111827]">{selectedOrder.dealerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Field Officer:</span>
                <span className="font-medium text-[#111827]">{selectedOrder.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Status:</span>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>
            </div>

            {/* Products & Quantities List (NO PRICES) */}
            <div className="mb-4">
              <span className="text-[10px] uppercase font-mono font-bold text-[#6B7280] block mb-2">
                Ordered Products & Quantities ({selectedOrder.items?.length || 0}):
              </span>
              <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-150 text-xs">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[10px] bg-[#111827] text-white px-1.5 py-0.2 rounded">
                          {item.productCode}
                        </span>
                        <span>{item.productName}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        {item.variantDescription}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-neutral-900 text-xs text-right">
                      {item.quantity} {item.packingUnit || 'Pcs'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct WhatsApp Actions */}
            <div className="space-y-2">
              <a
                href={`https://wa.me/${selectedOrder.dealerPhone?.replace(/\D/g, '').length === 10 ? `91${selectedOrder.dealerPhone?.replace(/\D/g, '')}` : selectedOrder.dealerPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(getWhatsAppMessageText(selectedOrder))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Send to Dealer ({selectedOrder.dealerPhone})</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>




              <button
                type="button"
                onClick={() => handleCopyWhatsApp(selectedOrder)}
                className="w-full border border-neutral-300 hover:bg-neutral-100 text-[#111827] text-xs font-medium py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                {copiedWhatsApp ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">WhatsApp Message Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Copy WhatsApp Order List</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
