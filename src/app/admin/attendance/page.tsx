'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore, store } from '@/data/store';
import { DailyAttendanceSummary, WeeklyAttendanceSummary, MonthlyAttendanceSummary } from '@/types';
import {
  Calendar,
  Clock,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  Send,
  Eye,
  Filter,
  ShieldCheck,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';

export default function AdminAttendancePage() {
  const { dailyAttendance, weeklyAttendance, monthlyAttendance, employees } = useAppStore();

  const [viewMode, setViewMode] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [selectedDate, setSelectedDate] = useState('2026-09-11');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRecordForInspection, setSelectedRecordForInspection] = useState<DailyAttendanceSummary | null>(null);
  const [reminderSentForId, setReminderSentForId] = useState<string | null>(null);

  // Daily statistics
  const totalStaff = dailyAttendance.length;
  const activeOnFieldCount = dailyAttendance.filter((r) => r.status === 'ACTIVE_ON_FIELD').length;
  const checkedOutCount = dailyAttendance.filter((r) => r.status === 'CHECKED_OUT').length;
  const presentTotal = activeOnFieldCount + checkedOutCount;
  const absentCount = dailyAttendance.filter((r) => r.status === 'ABSENT').length;
  const leaveCount = dailyAttendance.filter((r) => r.status === 'ON_LEAVE').length;

  const filteredDaily = dailyAttendance.filter((r) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PRESENT') return r.status === 'ACTIVE_ON_FIELD' || r.status === 'CHECKED_OUT';
    return r.status === statusFilter;
  });

  const handleSendReminder = (employeeId: string) => {
    store.sendAttendanceReminderWhatsApp(employeeId);
    setReminderSentForId(employeeId);
    setTimeout(() => setReminderSentForId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Attendance Operations" subtitle="Field Personnel Governance" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Header with View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold text-[#DC2626] tracking-wider">
                CENTRAL HR & FIELD MONITORING
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-xs text-[#6B7280] font-mono">GPS & Biometric Photo Audit</span>
            </div>
            <h1 className="text-xl font-bold text-[#111827] mt-0.5">
              Attendance & Location Tracking
            </h1>
          </div>

          {/* Timeframe Switcher Tabs */}
          <div className="flex items-center bg-white border border-[#E5E7EB] rounded-lg p-1 shadow-2xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('DAILY')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'DAILY'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Daily View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('WEEKLY')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'WEEKLY'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Weekly Summary
            </button>
            <button
              type="button"
              onClick={() => setViewMode('MONTHLY')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'MONTHLY'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Monthly Salary Ledger
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: DAILY ATTENDANCE & LOCATION TRACKING             */}
        {/* ========================================================= */}
        {viewMode === 'DAILY' && (
          <div className="space-y-4">
            {/* Daily Operational Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
                <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Total Field Reps</span>
                <div className="text-2xl font-bold font-mono text-[#111827] mt-1">{totalStaff}</div>
                <span className="text-[10px] text-[#6B7280]">All Gujarat Zones</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
                <span className="text-[10px] uppercase font-mono text-emerald-700 block font-semibold">
                  Active on Field
                </span>
                <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                  {activeOnFieldCount}
                </div>
                <span className="text-[10px] text-emerald-800">Checked in & visiting</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
                <span className="text-[10px] uppercase font-mono text-sky-700 block font-semibold">
                  Completed Shift
                </span>
                <div className="text-2xl font-bold font-mono text-sky-700 mt-1">
                  {checkedOutCount}
                </div>
                <span className="text-[10px] text-sky-800">Checked out with GPS</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
                <span className="text-[10px] uppercase font-mono text-rose-700 block font-semibold">
                  Absent / Missing Punch
                </span>
                <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
                  {absentCount}
                </div>
                <span className="text-[10px] text-rose-800 font-medium">1-Click WhatsApp ready</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-mono text-amber-700 block font-semibold">
                  On Approved Leave
                </span>
                <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
                  {leaveCount}
                </div>
                <span className="text-[10px] text-amber-800">Medical / Casual Leave</span>
              </div>
            </div>

            {/* Daily Date Selector & Filter Toolbar */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#DC2626]" />
                <span className="font-semibold text-[#111827]">Date:</span>
                <span className="font-mono bg-neutral-100 text-[#111827] px-2.5 py-1 rounded font-bold">
                  Friday, 11 Sep 2026 (Today)
                </span>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    statusFilter === 'ALL'
                      ? 'bg-[#111827] text-white font-semibold'
                      : 'bg-neutral-100 text-[#4B5563] hover:bg-neutral-200'
                  }`}
                >
                  All ({totalStaff})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE_ON_FIELD')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    statusFilter === 'ACTIVE_ON_FIELD'
                      ? 'bg-emerald-700 text-white font-semibold'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  On Field ({activeOnFieldCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('CHECKED_OUT')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    statusFilter === 'CHECKED_OUT'
                      ? 'bg-sky-700 text-white font-semibold'
                      : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
                  }`}
                >
                  Checked Out ({checkedOutCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ABSENT')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    statusFilter === 'ABSENT'
                      ? 'bg-rose-700 text-white font-semibold'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  Absent ({absentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ON_LEAVE')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    statusFilter === 'ON_LEAVE'
                      ? 'bg-amber-700 text-white font-semibold'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  On Leave ({leaveCount})
                </button>
              </div>
            </div>

            {/* Detailed Attendance Roster Table */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9FA] text-[#4B5563] font-mono uppercase text-[10px] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4">Check-In (Time & GPS Location)</th>
                      <th className="py-3 px-4">Check-Out (Time & GPS Location)</th>
                      <th className="py-3 px-3 text-right">Field Route</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredDaily.map((record) => (
                      <tr key={record.id} className="hover:bg-neutral-50/60 transition-colors">
                        {/* Employee Details */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs font-mono shrink-0">
                              {record.employeeName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-[#111827]">
                                {record.employeeName}
                              </div>
                              <div className="text-[10px] text-[#6B7280] font-mono">
                                {record.employeeCode} • {record.territory}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {record.status === 'ACTIVE_ON_FIELD' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active on Field
                            </span>
                          )}
                          {record.status === 'CHECKED_OUT' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-50 text-sky-800 border border-sky-200">
                              Checked Out ({record.hoursWorked}h)
                            </span>
                          )}
                          {record.status === 'ABSENT' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Absent
                            </span>
                          )}
                          {record.status === 'ON_LEAVE' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              Approved Leave
                            </span>
                          )}
                        </td>

                        {/* Check-In Column with Verified Location */}
                        <td className="py-3 px-4 max-w-xs">
                          {record.checkIn ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-xs text-[#111827]">
                                  {record.checkIn.time}
                                </span>
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  GPS Verified
                                </span>
                              </div>
                              <div className="text-[11px] text-[#4B5563] flex items-start gap-1 mt-0.5 line-clamp-1">
                                <MapPin className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
                                <span>{record.checkIn.locationName}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#9CA3AF] text-xs font-mono">— Not Recorded —</span>
                          )}
                        </td>

                        {/* Check-Out Column with Verified Location */}
                        <td className="py-3 px-4 max-w-xs">
                          {record.checkOut ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-xs text-[#111827]">
                                  {record.checkOut.time}
                                </span>
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-sky-700 bg-sky-50 px-1 rounded border border-sky-200">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  GPS Verified
                                </span>
                              </div>
                              <div className="text-[11px] text-[#4B5563] flex items-start gap-1 mt-0.5 line-clamp-1">
                                <MapPin className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
                                <span>{record.checkOut.locationName}</span>
                              </div>
                            </div>
                          ) : record.status === 'ACTIVE_ON_FIELD' ? (
                            <span className="text-emerald-700 font-mono text-[11px] font-medium">
                              Shift in progress ({record.hoursWorked}h active)
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF] text-xs font-mono">—</span>
                          )}
                        </td>

                        {/* Field Route & Visits */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-mono font-semibold text-xs text-[#111827]">
                            {record.dealerVisitsCount || 0} Visits
                          </div>
                          <div className="text-[10px] text-emerald-700 font-mono">
                            {record.ordersCount || 0} Orders
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {record.status === 'ABSENT' ? (
                            <button
                              type="button"
                              onClick={() => handleSendReminder(record.employeeId)}
                              className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-black text-white text-[11px] font-semibold px-2.5 py-1.5 rounded transition-all shadow-xs"
                            >
                              <Send className="w-3 h-3 text-emerald-400" />
                              <span>
                                {reminderSentForId === record.employeeId ? 'WhatsApp Sent!' : 'WhatsApp Alert'}
                              </span>
                            </button>
                          ) : record.checkIn ? (
                            <button
                              type="button"
                              onClick={() => setSelectedRecordForInspection(record)}
                              className="inline-flex items-center gap-1 border border-[#E5E7EB] hover:bg-neutral-100 text-[#111827] text-[11px] font-medium px-2.5 py-1.5 rounded transition-all"
                            >
                              <Eye className="w-3.5 h-3.5 text-neutral-500" />
                              <span>Inspect GPS/Photo</span>
                            </button>
                          ) : (
                            <span className="text-neutral-400 text-xs font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: WEEKLY ATTENDANCE SUMMARY                        */}
        {/* ========================================================= */}
        {viewMode === 'WEEKLY' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F3F4F6] gap-2">
              <div>
                <h3 className="font-bold text-sm text-[#111827]">
                  Weekly Field Operations Overview (07 Sep – 11 Sep 2026)
                </h3>
                <p className="text-xs text-[#6B7280]">
                  5-day working week tracking presence, hours logged, and missing check-in exceptions
                </p>
              </div>
              <span className="text-xs font-mono text-[#6B7280]">Target Hours: 40h/week</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#4B5563] font-mono uppercase text-[10px] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="py-2.5 px-3">Field Representative</th>
                    <th className="py-2.5 px-3 text-center">Mon (07)</th>
                    <th className="py-2.5 px-3 text-center">Tue (08)</th>
                    <th className="py-2.5 px-3 text-center">Wed (09)</th>
                    <th className="py-2.5 px-3 text-center">Thu (10)</th>
                    <th className="py-2.5 px-3 text-center">Fri (11)</th>
                    <th className="py-2.5 px-3 text-right">Present / Absent</th>
                    <th className="py-2.5 px-3 text-right">Total Hours</th>
                    <th className="py-2.5 px-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {weeklyAttendance.map((weekly) => (
                    <tr key={weekly.employeeId} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#111827]">{weekly.employeeName}</div>
                        <div className="text-[10px] text-[#6B7280] font-mono">
                          {weekly.employeeCode} • {weekly.territory}
                        </div>
                      </td>

                      {weekly.days.map((d) => (
                        <td key={d.date} className="py-3 px-3 text-center">
                          {d.status === 'CHECKED_OUT' && (
                            <div className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
                              ✓ {d.hours}h
                            </div>
                          )}
                          {d.status === 'ACTIVE_ON_FIELD' && (
                            <div className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold animate-pulse">
                              On Field
                            </div>
                          )}
                          {d.status === 'ABSENT' && (
                            <div className="inline-block px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-mono font-bold">
                              ✗ Absent
                            </div>
                          )}
                          {d.status === 'ON_LEAVE' && (
                            <div className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-medium">
                              Leave
                            </div>
                          )}
                        </td>
                      ))}

                      <td className="py-3 px-3 text-right font-mono font-semibold text-[#111827]">
                        {weekly.totalPresent} / {weekly.totalAbsent}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-[#111827]">
                        {weekly.totalHours.toFixed(1)}h
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            weekly.attendancePercentage >= 90
                              ? 'bg-emerald-50 text-emerald-800'
                              : weekly.attendancePercentage >= 75
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {weekly.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: MONTHLY SALARY & ATTENDANCE LEDGER               */}
        {/* ========================================================= */}
        {viewMode === 'MONTHLY' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F3F4F6] gap-2">
              <div>
                <h3 className="font-bold text-sm text-[#111827]">
                  Monthly Attendance & Salary Correlation (September 2026)
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Directly links verified working days with payable monthly remuneration and target achievements
                </p>
              </div>
              <span className="text-xs font-mono text-[#6B7280]">10 Elapsed Working Days</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#4B5563] font-mono uppercase text-[10px] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="py-2.5 px-3">Field Representative</th>
                    <th className="py-2.5 px-3 text-right">Working Days</th>
                    <th className="py-2.5 px-3 text-right">Present</th>
                    <th className="py-2.5 px-3 text-right">Absent</th>
                    <th className="py-2.5 px-3 text-right">Approved Leave</th>
                    <th className="py-2.5 px-3 text-right">Attendance %</th>
                    <th className="py-2.5 px-3 text-right">Sales Booked</th>
                    <th className="py-2.5 px-3 text-right">Base Salary</th>
                    <th className="py-2.5 px-3 text-right">Payable Remuneration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {monthlyAttendance.map((m) => (
                    <tr key={m.employeeId} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#111827]">{m.employeeName}</div>
                        <div className="text-[10px] text-[#6B7280] font-mono">
                          {m.employeeCode} • {m.territory}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-[#4B5563]">
                        {m.totalWorkingDays}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                        {m.presentDays}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                        {m.absentDays}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-amber-700">
                        {m.leaveDays}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="font-mono text-xs font-bold text-[#111827]">
                          {m.attendancePercentage}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-[#111827]">
                        ₹{m.totalSalesAchieved.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-[#6B7280]">
                        ₹{m.baseSalary.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                        ₹{m.payableSalary.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <MobileBottomNav />

      {/* ========================================================= */}
      {/* GPS & PHOTO VERIFICATION INSPECTION DRAWER               */}
      {/* ========================================================= */}
      {selectedRecordForInspection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-[#111827]">
                    {selectedRecordForInspection.employeeName}
                  </h3>
                  <span className="tech-code font-bold text-[11px] bg-[#111827] text-white px-2 py-0.5 rounded">
                    {selectedRecordForInspection.employeeCode}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Territory: {selectedRecordForInspection.territory} • {selectedRecordForInspection.date}
                </p>
              </div>

              <button
                onClick={() => setSelectedRecordForInspection(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-md hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Check-In Card */}
              {selectedRecordForInspection.checkIn && (
                <div className="border border-[#E5E7EB] rounded-lg p-3.5 bg-neutral-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs uppercase font-mono text-[#111827]">
                        Morning Check-In Punch
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      {selectedRecordForInspection.checkIn.time}
                    </span>
                  </div>

                  <div className="flex gap-3 mt-3">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-neutral-300 relative">
                      <img
                        src={selectedRecordForInspection.checkIn.photoUrl}
                        alt="Check-in Photo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center font-mono py-0.5">
                        Selfie Audit
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-[#4B5563]">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span className="font-medium text-[#111827]">
                          {selectedRecordForInspection.checkIn.locationName}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-[#6B7280]">
                        GPS Coordinates: {selectedRecordForInspection.checkIn.latitude}, {selectedRecordForInspection.checkIn.longitude}
                      </div>
                      <div className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" />
                        Live Device Verified
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Check-Out Card */}
              {selectedRecordForInspection.checkOut ? (
                <div className="border border-[#E5E7EB] rounded-lg p-3.5 bg-neutral-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span className="font-bold text-xs uppercase font-mono text-[#111827]">
                        Evening Check-Out Punch
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-sky-700">
                      {selectedRecordForInspection.checkOut.time}
                    </span>
                  </div>

                  <div className="flex gap-3 mt-3">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-neutral-300 relative">
                      <img
                        src={selectedRecordForInspection.checkOut.photoUrl}
                        alt="Check-out Photo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center font-mono py-0.5">
                        Selfie Audit
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-[#4B5563]">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span className="font-medium text-[#111827]">
                          {selectedRecordForInspection.checkOut.locationName}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-[#6B7280]">
                        GPS Coordinates: {selectedRecordForInspection.checkOut.latitude}, {selectedRecordForInspection.checkOut.longitude}
                      </div>
                      <div className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                        <ShieldCheck className="w-3 h-3" />
                        Live Device Verified
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedRecordForInspection.status === 'ACTIVE_ON_FIELD' ? (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Shift currently active in field. Pending evening check-out.</span>
                </div>
              ) : null}

              {/* Working Hours & Field Output */}
              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">Total Duration</span>
                  <span className="font-mono font-bold text-[#111827]">
                    {selectedRecordForInspection.hoursWorked || 0} Hours
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">Dealer Visits</span>
                  <span className="font-mono font-bold text-[#111827]">
                    {selectedRecordForInspection.dealerVisitsCount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">Orders Generated</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {selectedRecordForInspection.ordersCount || 0}
                  </span>
                </div>
              </div>

              {selectedRecordForInspection.notes && (
                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200 text-xs text-[#4B5563]">
                  <span className="font-semibold text-[#111827]">Field Note:</span> {selectedRecordForInspection.notes}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F8F9FA] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecordForInspection(null)}
                className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
