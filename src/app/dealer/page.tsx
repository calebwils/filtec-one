'use client';

import React from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { useAppStore } from '@/data/store';
import {
  Award,
  Clock,
  FileText,
  Users,
  ArrowRight,
  TrendingUp,
  Building2,
  Phone,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Download
} from 'lucide-react';

export default function DealerHomePage() {
  const { currentUser, dealers, orders, rewardLedger, plumbers } = useAppStore();

  const currentDealer =
    dealers.find((d) => d.id === currentUser.dealerId) || dealers[0];

  const dealerOrders = orders.filter((o) => o.dealerId === currentDealer.id);
  const awaitingConfirmationCount = dealerOrders.filter((o) => o.status === 'PENDING_ADMIN_APPROVAL').length;
  const dealerPlumbers = plumbers.filter((p) => p.dealerId === currentDealer.id);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Dealer Portal" subtitle={currentDealer.name} />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* YOUR BUSINESS HERO (Contextual, No AI-generic fluff) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F3F4F6]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold text-[#DC2626] tracking-wider">
                  YOUR BUSINESS
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-xs text-[#6B7280] font-mono">{currentDealer.tier} Partner</span>
              </div>
              <h1 className="text-xl font-bold text-[#111827] mt-1">
                {currentDealer.name}
              </h1>
              <p className="text-xs text-[#6B7280]">
                {currentDealer.address}, {currentDealer.city}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dealer/catalogue"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-all shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Product Catalogue</span>
              </Link>

              <Link
                href="/dealer/rewards"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#111827] hover:bg-black text-white transition-all shadow-xs"
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Rewards</span>
              </Link>

              <Link
                href="/dealer/plumbers"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-[#111827] transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Manage Plumbers ({dealerPlumbers.length})</span>
              </Link>
            </div>
          </div>

          {/* Contextual Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Total Purchases</span>
              <div className="text-lg font-bold font-mono text-[#111827] mt-0.5">
                ₹{currentDealer.totalPurchases.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-[#6B7280]">Financial source: ERP</span>
            </div>

            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Available Rewards</span>
              <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                ₹{currentDealer.availableRewards.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-800 font-medium">Ready for allocation</span>
            </div>

            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Pending Approval</span>
              <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
                {awaitingConfirmationCount}
              </div>
              <span className="text-[10px] text-amber-800">Awaiting central review</span>
            </div>

            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Credit Limit</span>
              <div className="text-lg font-bold font-mono text-[#111827] mt-0.5">
                ₹{currentDealer.creditLimit.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-[#6B7280]">
                Bal: ₹{currentDealer.outstandingBalance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* PRODUCT CATALOGUE CARD */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-neutral-700" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#111827]">FILTEC Product Catalogue</div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Official specifications, size variants, and wholesale price list
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dealer/catalogue"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-[#111827] transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Browse Catalogue</span>
            </Link>
            <a
              href="/api/catalogue/download"
              download="FILTEC_CATALOGUE_01.07.2026.pdf"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#111827] hover:bg-black text-white transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>

        {/* RECENT ORDERS FOR THIS DEALER */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase font-mono tracking-tight">
                Current Orders
              </h3>
              <p className="text-xs text-[#6B7280]">Real-time status updates and delivery invoices</p>
            </div>
            <Link
              href="/dealer/orders"
              className="text-xs font-semibold text-[#DC2626] hover:underline flex items-center gap-1"
            >
              <span>View All ({dealerOrders.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#F3F4F6]">
            {dealerOrders.length > 0 ? (
              dealerOrders.map((order) => (
                <div key={order.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="tech-code font-bold text-xs text-[#111827]">
                        {order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="text-[#4B5563] mt-1">
                      {order.items.length} line items • Rep: {order.employeeName}
                    </div>
                    <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100">
                    <div className="font-mono font-bold text-sm text-[#111827]">
                      ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-mono">
                      +₹{order.rewardDealerShare.toFixed(2)} Dealer Reward
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-[#6B7280]">
                No orders placed yet.
              </div>
            )}
          </div>
        </div>

        {/* REWARDS & PLUMBER POOL TEASER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reward ledger summary */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
              <h3 className="text-xs font-bold uppercase font-mono text-[#111827]">
                Reward Points Ledger
              </h3>
              <Link href="/dealer/rewards" className="text-xs text-[#DC2626] font-semibold hover:underline">
                Full Ledger
              </Link>
            </div>

            <div className="divide-y divide-[#F3F4F6]">
              {rewardLedger.slice(0, 3).map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-[#111827]">{tx.description}</div>
                    <span className="text-[10px] text-[#9CA3AF] font-mono">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    className={`font-mono font-bold ${
                      tx.amount > 0 ? 'text-emerald-700' : 'text-blue-700'
                    }`}
                  >
                    {tx.amount > 0 ? `+ ₹${tx.amount.toLocaleString('en-IN')}` : `- ₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plumber quick roster */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
              <h3 className="text-xs font-bold uppercase font-mono text-[#111827]">
                Associated Plumbers
              </h3>
              <Link href="/dealer/plumbers" className="text-xs text-[#DC2626] font-semibold hover:underline">
                Manage Roster
              </Link>
            </div>

            <div className="divide-y divide-[#F3F4F6]">
              {dealerPlumbers.slice(0, 3).map((plumber) => (
                <div key={plumber.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-[#111827]">{plumber.name}</div>
                    <div className="text-[10px] text-[#6B7280] font-mono">{plumber.phone}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-[#111827]">
                      ₹{plumber.totalAllocatedRewards.toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[10px] text-[#9CA3AF]">Allocated</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
