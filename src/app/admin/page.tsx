'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';

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



  const recentOrders = orders.filter((o) => o.status === 'SUBMITTED' || o.status === 'PENDING_ADMIN_APPROVAL').slice(0, 5);
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED');

  const inStockProductsCount = products.filter((p) => !p.isArchived && p.inStock !== false).length;
  const outOfStockProductsCount = products.filter((p) => !p.isArchived && p.inStock === false).length;

  const totalRevenue = orders
    .filter((o) => o.status !== 'REJECTED' && o.status !== 'CANCELLED')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Control Center" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* CONTROL CENTER HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#111827]">
              FILTEC Control Center
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>⚡ Executive Live Dashboard</span>
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Recent Orders ({recentOrders.length})</span>
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
              </div>
              <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#DC2626] transition-colors">
                Catalogue
              </h3>
              <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2">
                Browse F-1..F-99+ products, variants, and packaging details.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-xs font-semibold text-[#DC2626]">
              <span>View Catalogue</span>
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
              </div>
              <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#DC2626] transition-colors">
                Attendance & Tracking
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
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {recentOrders.length} Orders
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#DC2626] transition-colors">
                Order Management
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
                Recent Orders
              </h3>
              <p className="text-xs text-[#6B7280]">
                Latest orders created by field reps — dispatch via WhatsApp to dealers
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

          {recentOrders.length > 0 ? (
            <div className="divide-y divide-[#E5E7EB]">
              {recentOrders.map((order) => (
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
                      Rep: {order.employeeName} • {order.items.length} items • Created {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

                    <Link
                      href="/admin/orders"
                      className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>View Orders</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center bg-[#F9FAFB] rounded-lg border border-dashed border-[#E5E7EB]">
              <Package className="w-6 h-6 text-blue-600 mx-auto mb-1.5" />
              <h4 className="font-semibold text-xs text-[#111827]">No Recent Orders</h4>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                New orders created by field reps will appear here.
              </p>
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
