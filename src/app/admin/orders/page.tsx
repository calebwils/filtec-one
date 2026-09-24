'use client';

import React, { useState } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { OrderApprovalModal } from '@/components/orders/OrderApprovalModal';
import { ProformaInvoiceModal } from '@/components/orders/ProformaInvoiceModal';
import { ReleaseOrderModal } from '@/components/orders/ReleaseOrderModal';
import { ViewDealerModal } from '@/components/admin/ViewDealerModal';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { useAppStore, store } from '@/data/store';
import { Order, Dealer } from '@/types';
import { Search, CheckCircle2, Building2, User, Eye, Receipt, FileText } from 'lucide-react';

export default function AdminOrdersPage() {
  const { orders, dealers } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProformaOrder, setSelectedProformaOrder] = useState<Order | null>(null);
  const [selectedDealerForView, setSelectedDealerForView] = useState<Dealer | null>(null);
  const [releasingOrder, setReleasingOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'SUBMITTED') {
      if (o.status !== 'SUBMITTED' && o.status !== 'PENDING_ADMIN_APPROVAL') return false;
    } else if (statusFilter !== 'ALL' && o.status !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.dealerName.toLowerCase().includes(q) ||
        o.employeeName.toLowerCase().includes(q) ||
        (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Orders" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Orders</h2>
            <p className="text-xs text-[#6B7280]">
              View created field orders and release for fulfillment
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, dealer, rep name, or invoice..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['ALL', 'SUBMITTED', 'COMPLETED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md font-mono text-[11px] whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-[#111827] text-white font-medium'
                    : 'bg-neutral-100 text-[#4B5563] hover:bg-neutral-200'
                }`}
              >
                {st === 'SUBMITTED' ? 'Created' : st === 'COMPLETED' ? 'Completed' : 'ALL'}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] text-[#4B5563] font-mono uppercase text-[10px] border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Dealer</th>
                  <th className="py-3 px-4">Sales Rep</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="tech-code font-bold text-xs text-[#111827]">
                        {order.orderNumber}
                      </span>
                      <div className="text-[10px] text-[#9CA3AF] font-mono">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          const dlr =
                            dealers.find((d) => d.id === order.dealerId) ||
                            dealers.find((d) => d.name?.toLowerCase() === order.dealerName?.toLowerCase());
                          if (dlr) {
                            setSelectedDealerForView(dlr);
                          } else {
                            setSelectedDealerForView({
                              id: order.dealerId || 'dlr-temp',
                              name: order.dealerName,
                              code: 'DLR-PARTNER',
                              ownerName: 'Authorized Signatory',
                              phone: order.dealerPhone || '—',
                              address: '—',
                              city: order.dealerCity || '—',
                              state: '21-Odisha',
                              creditLimit: 0,
                              outstandingBalance: 0,
                              tier: 'Silver',
                              totalPurchases: 0,
                              availableRewards: 0,
                              plumbersCount: 0
                            });
                          }
                        }}
                        className="text-left group cursor-pointer"
                        title="Click to view full dealer profile"
                      >
                        <div className="font-semibold text-[#111827] group-hover:text-neutral-600 flex items-center gap-1.5 transition-colors">
                          <span>{order.dealerName}</span>
                          <Building2 className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                        </div>
                        <div className="text-[10px] text-[#6B7280]">{order.dealerCity}</div>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#111827] font-medium">{order.employeeName}</div>
                      <div className="text-[10px] text-[#6B7280] font-mono">{order.employeeId}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#111827]">
                      ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="border border-[#E5E7EB] hover:bg-neutral-100 text-[#111827] text-[11px] font-medium px-2.5 py-1.5 rounded transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-neutral-400" />
                          <span>View</span>
                        </button>

                        {order.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => setReleasingOrder(order)}
                            className="bg-[#111827] hover:bg-black text-white text-[11px] font-medium px-3 py-1.5 rounded transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-300" />
                            <span>Release</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <MobileBottomNav />

      <OrderApprovalModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onOpenRelease={(ord) => {
          setSelectedOrder(null);
          setReleasingOrder(ord);
        }}
      />

      <ReleaseOrderModal
        order={releasingOrder}
        isOpen={Boolean(releasingOrder)}
        onClose={() => setReleasingOrder(null)}
      />

      <ProformaInvoiceModal
        order={selectedProformaOrder}
        isOpen={Boolean(selectedProformaOrder)}
        onClose={() => setSelectedProformaOrder(null)}
      />

      <ViewDealerModal
        dealer={selectedDealerForView}
        isOpen={Boolean(selectedDealerForView)}
        onClose={() => setSelectedDealerForView(null)}
      />
    </div>
  );
}
