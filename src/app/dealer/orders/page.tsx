'use client';

import React from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { useAppStore } from '@/data/store';
import { Building2, Clock, FileText } from 'lucide-react';

export default function DealerOrdersPage() {
  const { orders, currentUser, dealers } = useAppStore();
  const currentDealer = dealers.find((d) => d.id === currentUser.dealerId) || dealers[0];
  const dealerOrders = orders.filter((o) => o.dealerId === currentDealer.id);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Order Tracking" subtitle={currentDealer.name} />
      <DesktopSubNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Commercial Orders</h2>
          <p className="text-xs text-[#6B7280]">
            Live tracking of orders placed through your sales representative
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-[#E5E7EB]">
            {dealerOrders.length > 0 ? (
              dealerOrders.map((order) => (
                <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
                      {order.items.length} items • Sales Officer: {order.employeeName}
                    </div>

                    <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                      Submitted on {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-[#111827]">
                      ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-mono">
                      Dealer Reward: +₹{order.rewardDealerShare.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[#6B7280]">
                No orders found.
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
