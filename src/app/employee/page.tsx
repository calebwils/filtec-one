'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { CameraCaptureModal } from '@/components/attendance/CameraCaptureModal';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { useAppStore, store } from '@/data/store';
import {
  PlusCircle,
  Radio,
  MapPin,
  Building2,
  Phone,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function EmployeeHomePage() {
  const { currentUser, orders, dealers, attendanceRecords, cart } = useAppStore();
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');

  const employeeOrders = orders.filter((o) => o.employeeName === currentUser.name || o.employeeId === currentUser.employeeCode);
  const todaySales = employeeOrders.reduce((acc, o) => acc + o.totalAmount, 0);

  const lastAttendance = attendanceRecords[0];

  const handleStartOrderForDealer = (dealerId: string) => {
    store.setCartDealer(dealerId);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Today's Field Operations" subtitle="Field Operations & Orders" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* TODAY HERO SECTION (Quiet, Contextual, Industrial) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F3F4F6]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold text-[#DC2626] tracking-wider">
                  TODAY • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-xs text-[#6B7280] font-mono">
                  {lastAttendance?.type === 'CHECK_IN' ? 'Status: On Field' : 'Status: Ready to Check In'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#111827] mt-1">
                Field Schedule & Route
              </h2>
            </div>

            {/* Quick Actions (One-handed phone priority) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAttendanceMode(lastAttendance?.type === 'CHECK_IN' ? 'CHECK_OUT' : 'CHECK_IN');
                  setIsAttendanceModalOpen(true);
                }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E5E7EB] bg-neutral-50 hover:bg-neutral-100 text-[#111827] transition-all"
              >
                <Radio className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>{lastAttendance?.type === 'CHECK_IN' ? 'Check Out' : 'GPS Check In'}</span>
              </button>

              <Link
                href="/employee/orders/new"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-all shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Order</span>
              </Link>
            </div>
          </div>

          {/* Operational Metrics (No decorative charts, actual numbers) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Assigned Dealers</span>
              <div className="text-lg font-bold text-[#111827] font-mono mt-0.5">{dealers.length}</div>
              <span className="text-[10px] text-[#6B7280]">4 planned visits today</span>
            </div>

            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Active Orders</span>
              <div className="text-lg font-bold text-[#111827] font-mono mt-0.5">{employeeOrders.length}</div>
              <span className="text-[10px] text-amber-700 font-medium">1 awaiting central approval</span>
            </div>

            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Monthly Target</span>
              <div className="text-lg font-bold text-[#111827] font-mono mt-0.5">₹1.20 M</div>
              <span className="text-[10px] text-emerald-700 font-medium">₹845,000 achieved (70%)</span>
            </div>

            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] uppercase font-mono text-[#6B7280] block">GPS Verification</span>
              <div className="text-sm font-semibold text-[#111827] mt-1 truncate">
                {lastAttendance ? lastAttendance.locationName.split(',')[0] : 'Not recorded'}
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">
                {lastAttendance ? new Date(lastAttendance.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Tap Check In'}
              </span>
            </div>
          </div>
        </div>

        {/* TODAY'S DEALER VISITS LIST (Contextual action) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase font-mono tracking-tight">
                Dealers in Territory
              </h3>
              <p className="text-xs text-[#6B7280]">Select a dealer to inspect balances or create an order</p>
            </div>
            <Link
              href="/employee/dealers"
              className="text-xs font-semibold text-[#DC2626] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] uppercase font-mono text-[10px]">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Dealer Account</th>
                    <th className="py-2.5 px-3">City</th>
                    <th className="py-2.5 px-3">Outstanding</th>
                    <th className="py-2.5 px-3">Credit Limit</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {dealers.slice(0, 4).map((dealer) => (
                    <tr key={dealer.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="tech-code font-bold text-xs bg-[#111827] text-white px-2 py-0.5 rounded font-mono">
                          {dealer.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-xs text-[#111827]">{dealer.name}</div>
                        <div className="text-[10px] text-neutral-500">{dealer.tier} Tier • {dealer.ownerName}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-neutral-600">
                          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>{dealer.city}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono font-semibold text-amber-800">
                        ₹{dealer.outstandingBalance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-neutral-600">
                        ₹{dealer.creditLimit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`tel:${dealer.phone}`}
                            className="p-1.5 rounded border border-[#E5E7EB] hover:bg-neutral-100 text-neutral-700"
                            title="Call"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                          <Link
                            href="/employee/orders/new"
                            onClick={() => handleStartOrderForDealer(dealer.id)}
                            className="bg-[#111827] hover:bg-black text-white text-[11px] font-semibold py-1 px-2.5 rounded transition-all inline-flex items-center gap-1"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Order</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RECENT ORDERS IN FIELD */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#F3F4F6]">
            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase font-mono tracking-tight">
                Recent Orders in Territory
              </h3>
              <p className="text-xs text-[#6B7280]">Live status machine progression</p>
            </div>
            <Link
              href="/employee/orders"
              className="text-xs font-semibold text-[#DC2626] hover:underline flex items-center gap-1"
            >
              <span>All Orders ({orders.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#F3F4F6]">
            {orders.slice(0, 4).map((order) => (
              <div key={order.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0 font-mono text-xs font-bold">
                    {order.orderNumber.replace('ORD-2026-', '#')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#111827] font-mono">{order.orderNumber}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="text-xs text-[#4B5563] mt-0.5">{order.dealerName}</div>
                    <div className="text-[11px] text-[#6B7280] font-mono">
                      {order.items.length} items • {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                  <div className="font-bold text-sm text-[#111827] font-mono">
                    ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-mono">
                    +₹{order.rewardEstimated.toFixed(2)} reward
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Camera & GPS Attendance Modal */}
      <CameraCaptureModal
        isOpen={isAttendanceModalOpen}
        mode={attendanceMode}
        onClose={() => setIsAttendanceModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
