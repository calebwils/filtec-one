'use client';

import React, { useState } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { ProformaInvoiceModal } from '@/components/orders/ProformaInvoiceModal';
import { DealerCheckoutModal } from '@/components/orders/DealerCheckoutModal';
import { useAppStore } from '@/data/store';
import { Order } from '@/types';
import {
  Building2,
  Clock,
  FileText,
  ShoppingBag,
  ArrowRight,
  Printer,
  Receipt,
  Sparkles
} from 'lucide-react';

export default function DealerOrdersPage() {
  const { orders, currentUser, dealers, cart } = useAppStore();
  const [selectedProformaOrder, setSelectedProformaOrder] = useState<Order | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const currentDealer = dealers.find((d) => d.id === currentUser.dealerId) || dealers[0];
  const dealerOrders = orders.filter((o) => o.dealerId === currentDealer.id);

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
                  {cart.items.reduce((s, i) => s + i.quantity, 0)} total units) in your cart ready for Proforma generation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>Review & Generate Proforma</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Commercial Orders & Proformas</h2>
            <p className="text-xs text-[#6B7280]">
              Official proforma invoices and real-time status tracking for {currentDealer.name}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-[#E5E7EB]">
            {dealerOrders.length > 0 ? (
              dealerOrders.map((order) => (
                <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-neutral-50/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="tech-code font-bold text-xs text-[#111827]">
                        {order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} />
                      <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                        PI-{order.orderNumber.replace(/^ORD-/, '')}
                      </span>
                      {order.invoiceNumber && (
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {order.invoiceNumber}
                        </span>
                      )}
                    </div>

                    <div className="text-[#4B5563] mt-1">
                      {order.items.length} items • Sales Officer: {order.employeeName}
                    </div>

                    <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                      Submitted on {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-[#111827]">
                        ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        Dealer Reward: +₹{order.rewardDealerShare.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedProformaOrder(order)}
                      className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      title="View & Print Proforma Invoice"
                    >
                      <Receipt className="w-3.5 h-3.5 text-neutral-300" />
                      <span>View Proforma</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[#6B7280]">
                No orders found. Browse the catalogue to create your first order requisition.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Proforma Invoice Modal */}
      {selectedProformaOrder && (
        <ProformaInvoiceModal
          order={selectedProformaOrder}
          isOpen={true}
          onClose={() => setSelectedProformaOrder(null)}
        />
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
