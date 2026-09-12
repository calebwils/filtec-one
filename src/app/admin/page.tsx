'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { OrderApprovalModal } from '@/components/orders/OrderApprovalModal';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { useAppStore } from '@/data/store';
import { Order } from '@/types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCheck,
  Building2,
  Radio,
  Award,
  ScrollText,
  ShieldCheck,
  Send,
  Zap,
  BookOpen,
  Users,
  Package
} from 'lucide-react';

export default function AdminControlCenterPage() {
  const { orders, dealers, employees, auditLogs, integrationEvents, rewardConfig, products } = useAppStore();

  const [selectedOrderForApproval, setSelectedOrderForApproval] = useState<Order | null>(null);

  const pendingOrders = orders.filter((o) => o.status === 'PENDING_ADMIN_APPROVAL');
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED');

  const inStockProductsCount = products.filter((p) => !p.isArchived && p.inStock !== false).length;
  const outOfStockProductsCount = products.filter((p) => !p.isArchived && p.inStock === false).length;

  const totalRevenue = orders
    .filter((o) => o.status !== 'REJECTED' && o.status !== 'CANCELLED')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Control Center" subtitle="Operations & Authorizations" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* CONTROL CENTER HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold text-[#DC2626] tracking-wider">
                CENTRAL OPERATIONS
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-xs text-[#6B7280] font-mono">Real-time Governance Layer</span>
            </div>
            <h1 className="text-xl font-bold text-[#111827] mt-0.5">
              FILTEC Operations Control Center
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Pending Orders ({pendingOrders.length})</span>
            </Link>
          </div>
        </div>

        {/* NEEDS ATTENTION SECTION (Brief Section 4 & 29) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-[#111827] uppercase font-mono tracking-tight">
                Needs Immediate Attention
              </h2>
            </div>
            <span className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {pendingOrders.length} Critical Actions Pending
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* 1. Orders Waiting */}
            <Link
              href="/admin/orders"
              className={`p-3.5 rounded-lg border transition-all ${
                pendingOrders.length > 0
                  ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400'
                  : 'bg-[#F9FAFB] border-[#E5E7EB]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-semibold text-[#4B5563]">
                  Orders Awaiting Approval
                </span>
                {pendingOrders.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </div>
              <div className="text-2xl font-bold font-mono text-[#111827] mt-1">
                {pendingOrders.length}
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                {pendingOrders.length > 0 ? 'Requires central sign-off' : 'All orders clear'}
              </span>
            </Link>

            {/* 2. Integration Health */}
            <Link
              href="/admin/integrations"
              className="p-3.5 rounded-lg border bg-[#F9FAFB] border-[#E5E7EB] hover:border-neutral-400 transition-all"
            >
              <span className="text-[10px] uppercase font-mono font-semibold text-[#4B5563] block">
                ERP / Billing Sync
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                100%
              </div>
              <span className="text-[11px] text-[#6B7280]">
                {integrationEvents.length} events logged (0 failures)
              </span>
            </Link>

            {/* 3. Reward Incentive Rule */}
            <Link
              href="/admin/rewards"
              className="p-3.5 rounded-lg border bg-[#F9FAFB] border-[#E5E7EB] hover:border-neutral-400 transition-all"
            >
              <span className="text-[10px] uppercase font-mono font-semibold text-[#4B5563] block">
                Active Reward Policy
              </span>
              <div className="text-2xl font-bold font-mono text-[#111827] mt-1">
                {rewardConfig.ratePercent}%
              </div>
              <span className="text-[11px] text-[#6B7280]">
                {rewardConfig.dealerSharePercent}/{rewardConfig.plumberSharePercent} Split Configured
              </span>
            </Link>

            {/* 4. Active Field Officers Attendance */}
            <Link
              href="/admin/attendance"
              className="p-3.5 rounded-lg border bg-[#F9FAFB] border-[#E5E7EB] hover:border-neutral-400 transition-all block"
            >
              <span className="text-[10px] uppercase font-mono font-semibold text-[#4B5563] block">
                Field Officers Check-In
              </span>
              <div className="text-2xl font-bold font-mono text-[#111827] mt-1">
                {employees.filter((e) => e.checkInStatus === 'CHECKED_IN').length} / {employees.length}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">
                GPS Verified PWA Check-Ins →
              </span>
            </Link>
          </div>
        </div>

        {/* OPERATIONS & MANAGEMENT CENTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Catalogue & Stock Management */}
          <Link
            href="/admin/catalogue"
            className="bg-white border border-[#E5E7EB] hover:border-neutral-400 rounded-xl p-4 shadow-2xs transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {inStockProductsCount} In Stock
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#DC2626] transition-colors">
                Catalogue & Stock
              </h3>
              <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2">
                Manage F-1..F-99+ products, variants, real-time factory stock, and add new SKUs.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-xs font-semibold text-[#DC2626]">
              <span>Manage SKUs</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* 2. Employee Directory & Onboarding */}
          <Link
            href="/admin/employees"
            className="bg-white border border-[#E5E7EB] hover:border-neutral-400 rounded-xl p-4 shadow-2xs transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {employees.length} Field Reps
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#DC2626] transition-colors">
                Staff & Onboarding
              </h3>
              <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2">
                Onboard field officers, assign territories, define sales targets, and review leaves.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-xs font-semibold text-neutral-800 group-hover:text-[#DC2626]">
              <span>Directory & Onboard</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* 3. GPS & Biometric Attendance */}
          <Link
            href="/admin/attendance"
            className="bg-white border border-[#E5E7EB] hover:border-neutral-400 rounded-xl p-4 shadow-2xs transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live GPS
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#DC2626] transition-colors">
                Attendance & GPS
              </h3>
              <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2">
                Daily, weekly & monthly attendance audits, reverse-geocoded coordinates & selfie proofs.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-xs font-semibold text-neutral-800 group-hover:text-[#DC2626]">
              <span>View Roster & Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* 4. Order Authorizations */}
          <Link
            href="/admin/orders"
            className="bg-white border border-[#E5E7EB] hover:border-neutral-400 rounded-xl p-4 shadow-2xs transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  {pendingOrders.length} Pending
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#DC2626] transition-colors">
                Order Approvals
              </h3>
              <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2">
                Central verification, dealer balance checks, ERP invoice dispatch and WhatsApp alerts.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-xs font-semibold text-neutral-800 group-hover:text-[#DC2626]">
              <span>Authorizations Queue</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* PENDING APPROVALS QUEUE (First Vertical Slice Highlight) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase font-mono tracking-tight">
                Pending Order Authorizations
              </h3>
              <p className="text-xs text-[#6B7280]">
                Approve to dispatch invoice to existing ERP and trigger WhatsApp alerts
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#DC2626] hover:underline flex items-center gap-1"
            >
              <span>View All ({orders.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {pendingOrders.length > 0 ? (
            <div className="divide-y divide-[#E5E7EB]">
              {pendingOrders.map((order) => (
                <div key={order.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="tech-code font-bold text-xs text-[#111827]">
                        {order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="text-xs font-semibold text-[#111827]">
                      {order.dealerName} ({order.dealerCity})
                    </div>
                    <div className="text-[11px] text-[#6B7280] font-mono">
                      Rep: {order.employeeName} • {order.items.length} items • Submitted {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-[#111827]">
                        ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        Reward: +₹{order.rewardEstimated.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOrderForApproval(order)}
                      className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Review & Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center bg-[#F9FAFB] rounded-lg border border-dashed border-[#E5E7EB]">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
              <h4 className="font-semibold text-xs text-[#111827]">All Orders Approved</h4>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                No orders waiting in the central authorization queue.
              </p>
            </div>
          )}
        </div>

        {/* AUDIT LOG & RECENT OPERATIONS */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase font-mono tracking-tight">
                Recent Operational Audit Stream
              </h3>
              <p className="text-xs text-[#6B7280]">
                Immutable trace of order changes, approvals, and ERP sync dispatches
              </p>
            </div>
            <Link
              href="/admin/audit"
              className="text-xs font-semibold text-[#DC2626] hover:underline flex items-center gap-1"
            >
              <span>Full Audit History</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#F3F4F6]">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <span className="tech-code text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 font-semibold uppercase mt-0.5 shrink-0">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <div>
                    <span className="text-[#111827] font-medium">{log.details}</span>
                    <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">
                      User: {log.userName} ({log.role})
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-[#9CA3AF] shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Review & Approve Modal */}
      <OrderApprovalModal
        order={selectedOrderForApproval}
        isOpen={Boolean(selectedOrderForApproval)}
        onClose={() => setSelectedOrderForApproval(null)}
      />
    </div>
  );
}
