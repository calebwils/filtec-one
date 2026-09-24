'use client';

import React, { useState } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { DealerCheckoutModal } from '@/components/orders/DealerCheckoutModal';
import { useAppStore } from '@/data/store';
import { Order } from '@/types';
import {
  Building2,
  Clock,
  ShoppingBag,
  ArrowRight,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  X,
  Package
} from 'lucide-react';

export default function DealerOrdersPage() {
  const { orders, currentUser, dealers, cart, settings } = useAppStore();
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const currentDealer = dealers.find((d) => d.id === currentUser.dealerId) || dealers[0];
  const dealerOrders = orders.filter((o) => o.dealerId === currentDealer.id);

  // WhatsApp Order generator (Products + Quantities only, NO PRICES)
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
      <TopContextBar title="Order Tracking" subtitle={currentDealer.name} />
      <DesktopSubNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Active Draft Requisition Banner */}
        {cart.items.length > 0 && (
          <div className="bg-gradient-to-r from-neutral-900 to-[#111827] text-white p-4 rounded-xl border border-neutral-700 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DC2626] flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Active Order Requisition in Progress</h3>
                <p className="text-xs text-neutral-300 mt-0.5">
                  You have <strong className="text-white">{cart.items.length} products</strong> (
                  {cart.items.reduce((s, i) => s + i.quantity, 0)} total units) in your cart ready for submission.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>Review & Submit Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Order Tracking & History</h2>
            <p className="text-xs text-[#6B7280]">
              Real-time dispatch status tracking and WhatsApp requisition copies for {currentDealer.name}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-[#E5E7EB]">
            {dealerOrders.length > 0 ? (
              dealerOrders.map((order) => {
                const totalUnits = order.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
                return (
                  <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-neutral-50/50 transition-colors">
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

                      <div className="text-[#4B5563] mt-1">
                        {order.items.length} product lines • Sales Officer: {order.employeeName}
                      </div>

                      <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                        Submitted on {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-[#111827]">
                          {totalUnits} Units Booked
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium">
                          {order.items.length} Products
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedOrderDetails(order)}
                        className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                        title="View Order Requisition & WhatsApp Details"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp Order</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-[#6B7280]">
                No orders found. Browse the catalogue to create your first order requisition.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Order Details & WhatsApp Modal (NO PRICES) */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 text-left my-auto max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div>
                <h3 className="font-bold text-base text-[#111827]">
                  Order Requisition Details
                </h3>
                <span className="text-xs font-mono font-bold text-[#DC2626]">
                  {selectedOrderDetails.orderNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dealer & Order Metadata */}
            <div className="my-3 bg-neutral-50 rounded-xl p-3 border border-[#E5E7EB] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Dealer Partner:</span>
                <span className="font-bold text-[#111827]">{selectedOrderDetails.dealerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Phone:</span>
                <span className="font-mono text-[#111827]">{selectedOrderDetails.dealerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Status:</span>
                <OrderStatusBadge status={selectedOrderDetails.status} />
              </div>
            </div>

            {/* Products and Quantities list */}
            <div className="mb-4">
              <span className="text-[10px] uppercase font-mono font-bold text-[#6B7280] block mb-2">
                Products & Quantities:
              </span>
              <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-150 text-xs">
                {selectedOrderDetails.items.map((item) => (
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

            {/* WhatsApp Actions */}
            <div className="space-y-2">



              <button
                type="button"
                onClick={() => handleCopyWhatsApp(selectedOrderDetails)}
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

      {/* Dealer Checkout Modal */}
      <DealerCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <MobileBottomNav />
    </div>
  );
}
