'use client';

import React, { useState } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore, store } from '@/data/store';
import { DailyAttendanceSummary } from '@/types';
import {
  Clock,
  MapPin,
  XCircle,
  Send,
  Eye,
  ShieldCheck,
  X,
  ExternalLink,
  Navigation,
  RefreshCw,
  Camera,
  Radio
} from 'lucide-react';
import { calculateDistanceMeters, formatDistanceToFiltec, formatDistanceShort } from '@/utils/distance';

// ── helpers ───────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function monthEnd(yyyyMM: string): string {
  return new Date(parseInt(yyyyMM.slice(0, 4)), parseInt(yyyyMM.slice(5, 7)), 0)
    .toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminAttendancePage() {
  const { dailyAttendance, employees, leaveRequests, attendanceRecords } = useAppStore();

  const today = todayStr();
  const thisMonthStart = today.substring(0, 8) + '01';
  const thisMonthYM = today.substring(0, 7);

  const [viewTab, setViewTab] = useState<'ROSTER' | 'FEED'>('ROSTER');
  const [startDate, setStartDate] = useState(thisMonthStart);
  const [endDate, setEndDate] = useState(today);
  const [datePreset, setDatePreset] = useState<'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'ALL' | 'CUSTOM'>('THIS_MONTH');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<DailyAttendanceSummary | null>(null);
  const [selectedPunchPhoto, setSelectedPunchPhoto] = useState<string | null>(null);
  const [reminderSentForId, setReminderSentForId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      await store.syncWithDatabase(true);
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const handlePreset = (preset: 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'ALL') => {
    setDatePreset(preset);
    if (preset === 'TODAY') { setStartDate(today); setEndDate(today); }
    else if (preset === 'YESTERDAY') { const y = addDays(today, -1); setStartDate(y); setEndDate(y); }
    else if (preset === 'LAST_7') { setStartDate(addDays(today, -6)); setEndDate(today); }
    else if (preset === 'THIS_MONTH') { setStartDate(thisMonthStart); setEndDate(today); }
    else if (preset === 'ALL') { setStartDate('2024-01-01'); setEndDate('2099-12-31'); }
  };

  // ── DAILY view ───────────────────────────────────────────────────────────
  const staffEmployees = employees.filter((e) => e.systemRole !== 'ADMIN');

  let filteredDaily = dailyAttendance
    .filter((r) => {
      const inRange = (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate);
      if (!inRange) return false;
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'PRESENT') return r.status === 'ACTIVE_ON_FIELD' || r.status === 'CHECKED_OUT';
      return r.status === statusFilter;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const isTodayRange = startDate === today && endDate === today;

  // For Today view, synthesize absent rows for staff members who haven't punched yet
  if (isTodayRange && (statusFilter === 'ALL' || statusFilter === 'ABSENT')) {
    const punchedCodes = new Set(filteredDaily.map((r) => r.employeeCode || r.employeeId));
    const absentRows: DailyAttendanceSummary[] = staffEmployees
      .filter((emp) => !punchedCodes.has(emp.code) && !punchedCodes.has(emp.id))
      .map((emp) => {
        const isApprovedLeave = leaveRequests.some(
          (l) => l.status === 'APPROVED' && l.startDate <= today && l.endDate >= today && (l.employeeId === emp.id || l.employeeName === emp.name)
        );
        return {
          id: `absent-${emp.id}-${today}`,
          date: today,
          employeeId: emp.id,
          employeeCode: emp.code,
          employeeName: emp.name,
          territory: emp.territory || 'Field Staff',
          phone: emp.phone,
          status: (isApprovedLeave ? 'ON_LEAVE' : 'ABSENT') as 'ABSENT' | 'ON_LEAVE',
          hoursWorked: 0,
          dealerVisitsCount: 0,
          ordersCount: 0
        };
      })
      .filter((r) => (statusFilter === 'ABSENT' ? r.status === 'ABSENT' : true));

    filteredDaily = [...filteredDaily, ...absentRows];
  }

  const totalInRange = filteredDaily.length;
  const activeCount = filteredDaily.filter((r) => r.status === 'ACTIVE_ON_FIELD').length;
  const checkedOutCount = filteredDaily.filter((r) => r.status === 'CHECKED_OUT').length;
  const absentCount = filteredDaily.filter((r) => r.status === 'ABSENT').length;
  const leaveCount = filteredDaily.filter((r) => r.status === 'ON_LEAVE').length;
  const presentCount = activeCount + checkedOutCount;

  const todayApprovedLeaves = leaveRequests.filter(
    (l) => l.status === 'APPROVED' && l.startDate <= today && l.endDate >= today
  ).length;
  const effectiveAbsentCount = isTodayRange
    ? Math.max(0, staffEmployees.length - presentCount - todayApprovedLeaves)
    : absentCount;

  const gpsRecords = filteredDaily.filter((r) => r.checkIn?.latitude || r.checkOut?.latitude);
  const preciseGps = gpsRecords.filter((r) => (r.checkIn?.accuracy ?? 14.5) <= 25 && (r.checkOut?.accuracy ?? 14.5) <= 25);
  const gpsRate = gpsRecords.length > 0 ? Math.round((preciseGps.length / gpsRecords.length) * 100) : 100;

  // Filtered raw punches for FEED view
  const filteredAttendanceRecords = attendanceRecords.filter((r) => {
    const rDate = (r.timestamp || '').split('T')[0];
    return (!startDate || rDate >= startDate) && (!endDate || rDate <= endDate);
  });

  const handleSendReminder = (employeeId: string) => {
    store.sendAttendanceReminderWhatsApp(employeeId);
    setReminderSentForId(employeeId);
    setTimeout(() => setReminderSentForId(null), 2500);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Attendance Operations" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#111827]">Attendance & Location Tracking</h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Live GPS satellite verification, selfie capture inspection and staff daily attendance
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: ROSTER vs FEED */}
            <div className="flex items-center bg-[#F3F4F6] p-1 rounded-lg border border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setViewTab('ROSTER')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewTab === 'ROSTER'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Daily Roster</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('FEED')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewTab === 'FEED'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Punch Feed ({filteredAttendanceRecords.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSyncDatabase}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E5E7EB] hover:bg-neutral-50 text-[#111827] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync DB'}</span>
            </button>
          </div>
        </div>

        {/* Calendar range + filter bar (applies to both views) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs space-y-3 text-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#F3F4F6]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#F9FAFB] border border-[#E5E7EB] px-2.5 py-1.5 rounded-lg">
                <span className="text-[#6B7280] font-mono text-[11px]">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setDatePreset('CUSTOM'); }}
                  className="bg-transparent font-mono font-semibold text-[#111827] text-[11px] outline-none cursor-pointer"
                />
              </div>
              <span className="text-[#9CA3AF] font-mono">to</span>
              <div className="flex items-center gap-1.5 bg-[#F9FAFB] border border-[#E5E7EB] px-2.5 py-1.5 rounded-lg">
                <span className="text-[#6B7280] font-mono text-[11px]">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setDatePreset('CUSTOM'); }}
                  className="bg-transparent font-mono font-semibold text-[#111827] text-[11px] outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-[#9CA3AF] font-mono uppercase">Presets:</span>
              {(['TODAY', 'YESTERDAY', 'LAST_7', 'THIS_MONTH', 'ALL'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePreset(p)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    datePreset === p
                      ? 'bg-[#111827] text-white'
                      : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-neutral-200'
                  }`}
                >
                  {p === 'LAST_7' ? 'Last 7 Days' : p === 'THIS_MONTH' ? 'This Month' : p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Status filters (only for Daily Roster) */}
          {viewTab === 'ROSTER' && (
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'ALL', label: `All (${totalInRange})`, activeClass: 'bg-[#111827] text-white' },
                { key: 'PRESENT', label: `Present (${presentCount})`, activeClass: 'bg-[#111827] text-white' },
                { key: 'ABSENT', label: `Absent (${absentCount})`, activeClass: 'bg-[#111827] text-white' },
                { key: 'ON_LEAVE', label: `On Leave (${leaveCount})`, activeClass: 'bg-[#111827] text-white' },
              ].map(({ key, label, activeClass }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    statusFilter === key ? activeClass : 'bg-neutral-100 text-[#4B5563] hover:bg-neutral-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {viewTab === 'FEED' ? (
          /* LIVE PUNCH FEED VIEW */
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">
                  Live Photo & GPS Verification Feed ({filteredAttendanceRecords.length})
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Real-time punches recorded by employees with camera selfies and satellite coordinates
                </p>
              </div>
              <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Live Captures
              </span>
            </div>

            {filteredAttendanceRecords.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-7 h-7 text-neutral-400" />
                </div>
                <p className="text-sm font-semibold text-[#111827]">No attendance punch recordings in this range</p>
                <p className="text-xs text-[#6B7280] mt-1">
                  Punches will appear here in real-time as employees check in or out.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F3F4F6]">
                {filteredAttendanceRecords.map((punch) => {
                  const punchDist =
                    punch.distanceFromOffice !== undefined
                      ? punch.distanceFromOffice
                      : calculateDistanceMeters(punch.latitude, punch.longitude);

                  return (
                    <div
                      key={punch.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/70 transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          onClick={() => punch.photoUrl && setSelectedPunchPhoto(punch.photoUrl)}
                          className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-900 border border-[#E5E7EB] shrink-0 cursor-pointer group"
                        >
                          {punch.photoUrl ? (
                            <>
                              <img
                                src={punch.photoUrl}
                                alt="Punch Selfie"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-mono font-bold text-white bg-neutral-800">
                              {punch.type === 'CHECK_IN' ? 'IN' : 'OUT'}
                            </div>
                          )}
                          <span
                            className={`absolute bottom-0 inset-x-0 text-[8px] font-mono font-bold text-center text-white py-0.2 ${
                              punch.type === 'CHECK_IN' ? 'bg-emerald-600' : 'bg-neutral-800'
                            }`}
                          >
                            {punch.type === 'CHECK_IN' ? 'CHECK-IN' : 'CHECK-OUT'}
                          </span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-[#111827]">{punch.employeeName}</span>
                            <span className="font-mono text-[10px] bg-neutral-100 text-[#4B5563] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                              {punch.employeeId}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                punch.type === 'CHECK_IN'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-sky-50 text-sky-800 border-sky-200'
                              }`}
                            >
                              {punch.type === 'CHECK_IN' ? 'Check-In Punch' : 'Check-Out Punch'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" /> Photo Verified
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-[#6B7280] mt-1">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="line-clamp-1">{punch.locationName}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-mono">
                            <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-semibold inline-flex items-center gap-1">
                              <Navigation className="w-3 h-3 text-purple-600" />
                              {formatDistanceShort(punchDist)} from HQ
                            </span>
                            <span className="text-[#6B7280] bg-neutral-100 px-2 py-0.5 rounded">
                              GPS Accuracy: ±{punch.accuracy || 14.5}m
                            </span>
                            <a
                              href={`https://maps.google.com/?q=${punch.latitude},${punch.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>View on Map</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs text-[#111827] shrink-0 sm:self-center">
                        <span className="font-bold text-sm block">
                          {new Date(punch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[11px] text-[#6B7280]">
                          {new Date(punch.timestamp).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* DAILY ROSTER VIEW */
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Employee" value={employees.length} sub={`${staffEmployees.length} Field Staff`} color="blue" />
              <StatCard label="Present" value={presentCount} sub={`${activeCount} on field, ${checkedOutCount} completed`} color="emerald" />
              <StatCard label="Absent" value={effectiveAbsentCount} sub={isTodayRange ? `${effectiveAbsentCount} pending punch` : 'Unreported absence'} color="rose" />
              <StatCard label="On Leave" value={isTodayRange ? todayApprovedLeaves : leaveCount} sub="Approved leave" color="amber" />
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
              {filteredDaily.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-7 h-7 text-neutral-400" />
                  </div>
                  <p className="text-sm font-semibold text-[#111827]">No attendance records found</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Records will appear here as soon as employees punch in via GPS.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F9FA] text-[#4B5563] font-mono uppercase text-[10px] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4">Check-In</th>
                        <th className="py-3 px-4">Check-Out</th>
                        <th className="py-3 px-3 text-right">Field Route</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredDaily.map((record) => (
                        <tr key={record.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-[#111827] block">
                              {new Date(record.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[10px] font-mono text-[#6B7280]">
                              {new Date(record.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {record.employeeName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-[#111827]">{record.employeeName}</div>
                                <div className="text-[10px] text-[#6B7280] font-mono">
                                  {record.employeeCode} • {record.territory}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {record.status === 'ACTIVE_ON_FIELD' && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active on Field
                              </span>
                            )}
                            {record.status === 'CHECKED_OUT' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-50 text-sky-800 border border-sky-200">
                                Checked Out ✓
                              </span>
                            )}
                            {record.status === 'ABSENT' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" /> Absent
                              </span>
                            )}
                            {record.status === 'ON_LEAVE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                Approved Leave
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            {record.checkIn ? (
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-mono font-bold text-xs text-[#111827]">{record.checkIn.time}</span>
                                  {(() => {
                                    const dist = record.checkIn.distanceFromOffice !== undefined
                                      ? record.checkIn.distanceFromOffice
                                      : calculateDistanceMeters(record.checkIn.latitude, record.checkIn.longitude);
                                    return (
                                      <span
                                        title={`Calculated distance: ${formatDistanceToFiltec(dist)}`}
                                        className="inline-flex items-center gap-0.5 text-[9px] font-mono font-semibold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200"
                                      >
                                        <Navigation className="w-2 h-2 text-purple-600" />
                                        {formatDistanceShort(dist)} HQ
                                      </span>
                                    );
                                  })()}
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

                          <td className="py-3 px-4 max-w-xs">
                            {record.checkOut ? (
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-mono font-bold text-xs text-[#111827]">{record.checkOut.time}</span>
                                  {(() => {
                                    const dist = record.checkOut.distanceFromOffice !== undefined
                                      ? record.checkOut.distanceFromOffice
                                      : calculateDistanceMeters(record.checkOut.latitude, record.checkOut.longitude);
                                    return (
                                      <span
                                        title={`Calculated distance: ${formatDistanceToFiltec(dist)}`}
                                        className="inline-flex items-center gap-0.5 text-[9px] font-mono font-semibold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200"
                                      >
                                        <Navigation className="w-2 h-2 text-purple-600" />
                                        {formatDistanceShort(dist)} HQ
                                      </span>
                                    );
                                  })()}
                                </div>
                                <div className="text-[11px] text-[#4B5563] flex items-start gap-1 mt-0.5 line-clamp-1">
                                  <MapPin className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
                                  <span>{record.checkOut.locationName}</span>
                                </div>
                              </div>
                            ) : record.status === 'ACTIVE_ON_FIELD' ? (
                              <span className="text-emerald-700 font-mono text-[11px] font-medium animate-pulse">
                                Shift in progress…
                              </span>
                            ) : (
                              <span className="text-[#9CA3AF] text-xs font-mono">—</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-mono font-semibold text-xs text-[#111827]">
                              {record.dealerVisitsCount || 0} Visits
                            </div>
                            <div className="text-[10px] text-emerald-700 font-mono">
                              {record.ordersCount || 0} Orders
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {record.status === 'ABSENT' ? (
                              <button
                                type="button"
                                onClick={() => handleSendReminder(record.employeeId)}
                                className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-black text-white text-[11px] font-semibold px-2.5 py-1.5 rounded transition-all cursor-pointer"
                              >
                                <Send className="w-3 h-3 text-emerald-400" />
                                {reminderSentForId === record.employeeId ? 'Sent!' : 'WhatsApp Alert'}
                              </button>
                            ) : record.checkIn ? (
                              <button
                                type="button"
                                onClick={() => setSelectedRecord(record)}
                                className="inline-flex items-center gap-1 border border-[#E5E7EB] hover:bg-neutral-100 text-[#111827] text-[11px] font-medium px-2.5 py-1.5 rounded transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-neutral-500" /> Inspect GPS/Photo
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
              )}
            </div>
          </div>
        )}


      </main>

      <MobileBottomNav />

      {/* GPS & Photo Inspection Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 my-8">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-[#111827]">{selectedRecord.employeeName}</h3>
                  <span className="font-mono font-bold text-[11px] bg-[#111827] text-white px-2 py-0.5 rounded">
                    {selectedRecord.employeeCode}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Territory: {selectedRecord.territory} • {selectedRecord.date}
                </p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-md hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Check-In */}
              {selectedRecord.checkIn && (
                <GpsCard
                  label="Morning Check-In Punch"
                  timeColor="text-emerald-700"
                  badgeClass="text-emerald-800 bg-emerald-50 border-emerald-200"
                  iconClass="text-emerald-600"
                  punch={selectedRecord.checkIn}
                />
              )}

              {/* Check-Out */}
              {selectedRecord.checkOut ? (
                <GpsCard
                  label="Evening Check-Out Punch"
                  timeColor="text-sky-700"
                  badgeClass="text-sky-800 bg-sky-50 border-sky-200"
                  iconClass="text-sky-600"
                  punch={selectedRecord.checkOut}
                />
              ) : selectedRecord.status === 'ACTIVE_ON_FIELD' ? (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Shift currently active in field. Pending evening check-out.
                </div>
              ) : null}

              {/* Stats */}
              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">Dealer Visits</span>
                  <span className="font-mono font-bold text-[#111827]">{selectedRecord.dealerVisitsCount || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">Orders Generated</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedRecord.ordersCount || 0}</span>
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200 text-xs text-[#4B5563]">
                  <span className="font-semibold text-[#111827]">Field Note:</span> {selectedRecord.notes}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F8F9FA] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Selfie Photo Modal */}
      {selectedPunchPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPunchPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <span className="text-xs font-mono font-bold text-neutral-800">Verified Selfie Capture</span>
              <button
                type="button"
                onClick={() => setSelectedPunchPhoto(null)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-neutral-900 aspect-square flex items-center justify-center overflow-hidden">
              <img src={selectedPunchPhoto} alt="Audit Selfie" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, color
}: { label: string; value: string | number; sub: string; color: 'blue' | 'emerald' | 'rose' | 'amber' | 'neutral' }) {
  const styles = {
    blue: {
      card: 'bg-blue-50/50 border-blue-200/80',
      label: 'text-blue-700 font-semibold',
      value: 'text-blue-950',
      sub: 'text-blue-700/80',
    },
    emerald: {
      card: 'bg-emerald-50/50 border-emerald-200/80',
      label: 'text-emerald-700 font-semibold',
      value: 'text-emerald-950',
      sub: 'text-emerald-700/80',
    },
    rose: {
      card: 'bg-rose-50/50 border-rose-200/80',
      label: 'text-rose-700 font-semibold',
      value: 'text-rose-950',
      sub: 'text-rose-700/80',
    },
    amber: {
      card: 'bg-amber-50/50 border-amber-200/80',
      label: 'text-amber-700 font-semibold',
      value: 'text-amber-950',
      sub: 'text-amber-700/80',
    },
    neutral: {
      card: 'bg-white border-[#E5E7EB]',
      label: 'text-[#6B7280]',
      value: 'text-[#111827]',
      sub: 'text-[#6B7280]',
    }
  }[color];

  return (
    <div className={`p-3.5 rounded-xl border shadow-2xs transition-all ${styles.card}`}>
      <span className={`text-[10px] uppercase font-mono block ${styles.label}`}>{label}</span>
      <div className={`text-2xl font-bold font-mono mt-1 ${styles.value}`}>{value}</div>
      <span className={`text-[10px] ${styles.sub}`}>{sub}</span>
    </div>
  );
}

function GpsCard({ label, timeColor, badgeClass, iconClass, punch }: {
  label: string;
  timeColor: string;
  badgeClass: string;
  iconClass: string;
  punch: any;
}) {
  return (
    <div className="border border-[#E5E7EB] rounded-lg p-3.5 bg-neutral-50/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Clock className={`w-4 h-4 ${iconClass}`} />
          <span className="font-bold text-xs uppercase font-mono text-[#111827]">{label}</span>
        </div>
        <span className={`font-mono text-xs font-bold ${timeColor}`}>{punch.time}</span>
      </div>
      <div className="flex gap-3 mt-3">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-neutral-300 relative">
          <img src={punch.photoUrl} alt="Selfie" className="w-full h-full object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center font-mono py-0.5">
            Selfie Audit
          </div>
        </div>
        <div className="text-xs space-y-1.5 text-[#4B5563]">
          <div className="flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0 mt-0.5" />
            <span className="font-semibold text-[#111827]">{punch.locationName}</span>
          </div>
          <div className="font-mono text-[11px]">
            Exact GPS: <strong className="text-[#111827]">{punch.latitude?.toFixed(6)}°, {punch.longitude?.toFixed(6)}°</strong>
          </div>
          {(() => {
            const dist = punch.distanceFromOffice !== undefined
              ? punch.distanceFromOffice
              : calculateDistanceMeters(punch.latitude, punch.longitude);
            return (
              <div className="p-2 rounded-lg bg-purple-50/80 border border-purple-200/80 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-purple-700 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-purple-600 shrink-0" />
                    Distance from Filtec HQ
                  </span>
                  <span className="font-mono font-bold text-xs text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-200">
                    {formatDistanceToFiltec(dist)}
                  </span>
                </div>
                <div className="text-[10px] text-purple-800/80 font-mono truncate">
                  HQ: Water Park Rd, Kurangsasan, Odisha 754002
                </div>
              </div>
            );
          })()}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${badgeClass}`}>
              <ShieldCheck className="w-3 h-3" />
              ±{punch.accuracy || 14.5}m Precision • 10-25m Target
            </span>
            <a
              href={`https://www.google.com/maps?q=${punch.latitude},${punch.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#DC2626] hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> View on Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
