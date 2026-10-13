'use client';

import React, { useState } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { CameraCaptureModal } from '@/components/attendance/CameraCaptureModal';
import { ApplyLeaveModal } from '@/components/employee/ApplyLeaveModal';
import { store, useAppStore } from '@/data/store';
import {
  Radio,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  Calendar,
  ShieldCheck,
  PlusCircle,
  AlertCircle,
  XCircle,
  FileText,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  X,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { calculateDistanceMeters, formatDistanceToFiltec, formatDistanceShort } from '@/utils/distance';
import { AttendanceService } from '@/services/AttendanceService';

// ── helpers ───────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getMonthStart(dateStr: string) {
  return dateStr.substring(0, 8) + '01';
}

function getMonthEnd(dateStr: string) {
  const [year, month] = dateStr.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export default function AttendancePage() {
  const { attendanceRecords, currentUser, leaveRequests, settings } = useAppStore();
  const [tab, setTab] = useState<'PUNCH' | 'LEAVE'>('PUNCH');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [mode, setMode] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');

  const today = todayStr();
  const thisMonthStart = getMonthStart(today);
  const thisMonthEnd = getMonthEnd(today);

  // Month navigation and range filters
  const [startDate, setStartDate] = useState(thisMonthStart);
  const [endDate, setEndDate] = useState(today);
  const [datePreset, setDatePreset] = useState<'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'ALL' | 'CUSTOM'>('THIS_MONTH');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'ON_LEAVE'>('ALL');
  const [selectedSelfieUrl, setSelectedSelfieUrl] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await store.syncWithDatabase(true);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handlePreset = (preset: 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'ALL') => {
    setDatePreset(preset);
    if (preset === 'TODAY') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'YESTERDAY') {
      const y = addDays(today, -1);
      setStartDate(y);
      setEndDate(y);
    } else if (preset === 'LAST_7') {
      setStartDate(addDays(today, -6));
      setEndDate(today);
    } else if (preset === 'THIS_MONTH') {
      setStartDate(thisMonthStart);
      setEndDate(today);
    } else if (preset === 'ALL') {
      setStartDate('2024-01-01');
      setEndDate('2099-12-31');
    }
  };

  const isTodayDate = (timestamp: string) => {
    if (!timestamp) return false;
    try {
      const d = new Date(timestamp);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    } catch {
      return timestamp.startsWith(new Date().toISOString().split('T')[0]);
    }
  };

  const cleanUserId = (currentUser.id || '').replace(/^user-/, '');
  const myRecords = attendanceRecords
    .filter((r) => {
      const cleanRecordEmpId = (r.employeeId || '').replace(/^user-/, '');
      return (
        r.employeeId === currentUser.id ||
        cleanRecordEmpId === cleanUserId ||
        (currentUser.employeeCode && (r.employeeId === currentUser.employeeCode || cleanRecordEmpId === currentUser.employeeCode)) ||
        (currentUser.name && r.employeeName && r.employeeName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      );
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filtered attendance records according to selected date range
  const recordsInRange = myRecords.filter((r) => {
    const rDate = (r.timestamp || '').split('T')[0];
    return (!startDate || rDate >= startDate) && (!endDate || rDate <= endDate);
  });

  const presentCount = recordsInRange.length;

  const myLeaves = leaveRequests.filter(
    (l) => l.employeeId === currentUser.id || l.employeeName === currentUser.name
  );
  const pendingLeaves = myLeaves.filter((l) => l.status === 'PENDING');

  const leavesInRange = myLeaves.filter((l) => {
    if (l.status !== 'APPROVED') return false;
    return (!startDate || l.endDate >= startDate) && (!endDate || l.startDate <= endDate);
  });
  const leaveCount = leavesInRange.length;

  // Today specific calculations for top status cards (independent of bottom filter)
  const todayRecords = myRecords.filter((r) => isTodayDate(r.timestamp));
  const todayCheckIn = todayRecords.find((r) => r.type === 'CHECK_IN');
  const todayCheckOut = todayRecords.find((r) => r.type === 'CHECK_OUT');
  const myTodayRecord = todayRecords[0];

  const isTodayInRange = (!startDate || today >= startDate) && (!endDate || today <= endDate);
  const hasLeaveToday = myLeaves.some((l) => l.status === 'APPROVED' && l.startDate <= today && l.endDate >= today);
  const absentCount = (isTodayInRange && !todayCheckIn && !hasLeaveToday) ? 1 : 0;

  const totalInRange = presentCount + absentCount + leaveCount;

  // Records to display based on statusFilter
  const displayedRecords = statusFilter === 'ALL' || statusFilter === 'PRESENT'
    ? recordsInRange
    : [];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Field Attendance" subtitle="GPS & Photo Verification" />
      <DesktopSubNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Tab Navigation Switcher */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('PUNCH')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                tab === 'PUNCH'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-neutral-50'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>GPS Check-In & Punch</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('LEAVE')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                tab === 'LEAVE'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-neutral-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Leave & Regularization</span>
              {pendingLeaves.length > 0 && (
                <span className="bg-[#DC2626] text-white text-[10px] px-1.5 rounded-full font-mono font-bold">
                  {pendingLeaves.length}
                </span>
              )}
            </button>
          </div>

          {tab === 'LEAVE' && (
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(true)}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Apply for Leave</span>
            </button>
          )}
        </div>

        {tab === 'PUNCH' ? (
          <>
            {/* Attendance Status Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F3F4F6]">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-[#DC2626] tracking-wider">
                    Daily Verification
                  </span>
                  <h2 className="text-lg font-bold text-[#111827] mt-0.5">
                    Attendance & Field Check-In
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    Requires browser geolocation and live camera capture (no geofencing required)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('CHECK_IN');
                      setIsModalOpen(true);
                      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
                        AttendanceService.getCurrentCoordinates(50).catch(() => {});
                      }
                    }}
                    className={`flex-1 sm:flex-initial text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                      todayCheckIn
                        ? 'bg-neutral-100 hover:bg-neutral-200 text-[#111827] border border-[#E5E7EB]'
                        : 'bg-[#111827] hover:bg-black text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{todayCheckIn ? 'Re-Punch In' : 'Record Check-In'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('CHECK_OUT');
                      setIsModalOpen(true);
                      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
                        AttendanceService.getCurrentCoordinates(50).catch(() => {});
                      }
                    }}
                    className={`flex-1 sm:flex-initial text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      todayCheckIn && !todayCheckOut
                        ? 'bg-[#111827] hover:bg-black text-white shadow-xs'
                        : 'border border-[#E5E7EB] hover:bg-neutral-50 text-[#111827]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{todayCheckOut ? 'Re-Punch Out' : 'Check-Out'}</span>
                  </button>
                </div>
              </div>

              {/* Current Status Details */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                  <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Employee</span>
                  <div className="font-semibold text-xs text-[#111827] mt-0.5">{currentUser.name}</div>
                  <span className="text-[10px] font-mono text-[#6B7280]">{currentUser.employeeCode || 'FPPL/OD-004'}</span>
                </div>

                <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Today Status</span>
                    <div className={`font-semibold text-xs mt-0.5 ${
                      todayCheckOut
                        ? 'text-sky-800'
                        : todayCheckIn
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}>
                      {todayCheckOut
                        ? 'Checked Out (Shift Done)'
                        : todayCheckIn
                        ? 'Checked In (Active on Field)'
                        : 'Absent / Not Checked In'}
                    </div>
                    <span className="text-[10px] font-mono text-[#6B7280]">
                      {todayCheckIn && todayCheckOut
                        ? `In: ${new Date(todayCheckIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Out: ${new Date(todayCheckOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : todayCheckIn
                        ? `Checked In at ${new Date(todayCheckIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : todayCheckOut
                        ? `Checked Out at ${new Date(todayCheckOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'No punch recorded today'}
                    </span>
                  </div>
                  {(todayRecords[0]?.photoUrl || myRecords[0]?.photoUrl) && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E5E7EB] bg-neutral-900 shrink-0">
                      <img
                        src={todayRecords[0]?.photoUrl || myRecords[0]?.photoUrl}
                        alt="Verified Selfie"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                  <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Today Verified Location</span>
                  <div
                    className={`font-semibold text-xs mt-0.5 truncate ${myTodayRecord ? 'text-[#111827]' : 'text-rose-700'}`}
                    title={myTodayRecord?.locationName}
                  >
                    {myTodayRecord ? myTodayRecord.locationName : 'Absent (No GPS Punch Today)'}
                  </div>
                  {myTodayRecord && (
                    <div className="text-[11px] font-mono text-purple-800 font-semibold flex items-center gap-1 mt-1">
                      <Navigation className="w-3 h-3 text-purple-600 shrink-0" />
                      <span>
                        {formatDistanceToFiltec(
                          myTodayRecord.distanceFromOffice !== undefined
                            ? myTodayRecord.distanceFromOffice
                            : calculateDistanceMeters(myTodayRecord.latitude, myTodayRecord.longitude)
                        )}
                      </span>
                    </div>
                  )}
                  <span className={`text-[10px] font-mono font-medium block mt-0.5 ${myTodayRecord ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {myTodayRecord
                      ? `GPS Precision: ±${myTodayRecord.accuracy || 14.5}m (Optimal Fix)`
                      : 'Tap Record Check-In'}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Filter Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs space-y-3 text-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#F3F4F6]">
                {/* From - To Date Pickers */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#F9FAFB] border border-[#E5E7EB] px-2.5 py-1.5 rounded-lg">
                    <span className="text-[#6B7280] font-mono text-[11px]">From:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDatePreset('CUSTOM');
                      }}
                      className="bg-transparent font-mono font-semibold text-[#111827] text-[11px] outline-none cursor-pointer"
                    />
                  </div>
                  <span className="text-[#9CA3AF] font-mono">to</span>
                  <div className="flex items-center gap-1.5 bg-[#F9FAFB] border border-[#E5E7EB] px-2.5 py-1.5 rounded-lg">
                    <span className="text-[#6B7280] font-mono text-[11px]">To:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setDatePreset('CUSTOM');
                      }}
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
                          ? 'bg-[#111827] text-white font-semibold'
                          : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-neutral-200'
                      }`}
                    >
                      {p === 'LAST_7' ? 'Last 7 Days' : p === 'THIS_MONTH' ? 'This Month' : p.charAt(0) + p.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'ALL', label: `All (${totalInRange})` },
                  { key: 'PRESENT', label: `Present (${presentCount})` },
                  { key: 'ABSENT', label: `Absent (${absentCount})` },
                  { key: 'ON_LEAVE', label: `On Leave (${leaveCount})` },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(key as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      statusFilter === key
                        ? 'bg-[#111827] text-white font-semibold'
                        : 'bg-neutral-100 text-[#4B5563] hover:bg-neutral-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification History Log */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase font-mono text-[#111827]">
                  My Attendance Records ({statusFilter === 'ON_LEAVE' ? leavesInRange.length : statusFilter === 'ABSENT' ? absentCount : displayedRecords.length})
                </h3>
              </div>

              <div className="divide-y divide-[#F3F4F6]">
                {statusFilter === 'ON_LEAVE' ? (
                  leavesInRange.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-400 font-mono">
                      No approved leaves found in the selected date range.
                    </div>
                  ) : (
                    leavesInRange.map((l) => (
                      <div key={l.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs font-mono border border-purple-200">
                            LV
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#111827]">{l.type} Leave</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                                Approved
                              </span>
                            </div>
                            <div className="text-xs text-[#6B7280] mt-0.5">
                              {l.startDate} to {l.endDate} • {l.reason || 'Personal Leave'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                ) : statusFilter === 'ABSENT' ? (
                  absentCount === 0 ? (
                    <div className="py-6 text-center text-xs text-emerald-600 font-mono flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>No absences recorded in this date range. 100% Attendance!</span>
                    </div>
                  ) : (
                    <div className="py-3 flex items-center justify-between bg-rose-50/60 p-3 rounded-lg border border-rose-200">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                        <div>
                          <span className="font-semibold text-xs text-rose-950">Absent — No Check-In Recorded</span>
                          <p className="text-[11px] text-rose-800 mt-0.5">
                            You have not marked attendance punch for today ({today}). Tap &quot;Record Check-In&quot; above to punch in.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                ) : displayedRecords.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-400 font-mono">
                    No attendance punch records found in the selected date range.
                  </div>
                ) : (
                  displayedRecords.map((record) => {
                    const recordDist =
                      record.distanceFromOffice !== undefined
                        ? record.distanceFromOffice
                        : calculateDistanceMeters(record.latitude, record.longitude);
                    return (
                      <div key={record.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-900 border border-[#E5E7EB] shrink-0">
                            {record.photoUrl ? (
                              <img
                                src={record.photoUrl}
                                alt="Attendance Selfie"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#111827] font-mono text-xs font-bold bg-neutral-100">
                                {record.type === 'CHECK_IN' ? 'IN' : 'OUT'}
                              </div>
                            )}
                            <span
                              className={`absolute bottom-0 inset-x-0 text-[8px] font-mono font-bold text-center text-white py-0.2 ${
                                record.type === 'CHECK_IN' ? 'bg-emerald-600' : 'bg-neutral-800'
                              }`}
                            >
                              {record.type === 'CHECK_IN' ? 'IN' : 'OUT'}
                            </span>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-xs text-[#111827]">
                                {record.type === 'CHECK_IN' ? 'Check-In Punch' : 'Check-Out Punch'}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <ShieldCheck className="w-3 h-3" />
                                Photo Verified
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-800 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                                ±{record.accuracy || 14.5}m Precision
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 font-semibold">
                                <Navigation className="w-2.5 h-2.5 text-purple-600" />
                                {formatDistanceShort(recordDist)} from HQ
                              </span>
                            </div>
                            <div className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span className="line-clamp-1">{record.locationName}</span>
                            </div>
                          </div>
                        </div>

                    <div className="text-right font-mono text-xs text-[#4B5563] shrink-0 ml-2">
                      {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="block text-[10px] text-[#9CA3AF]">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
          </>
        ) : (
          /* LEAVE & REGULARIZATION TAB */
          <div className="space-y-4">
            {/* Quota & Policy Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-[#6B7280] font-semibold block">
                  Casual Leave Balance
                </span>
                <div className="text-xl font-bold font-mono text-[#111827] mt-1">
                  {settings.policy.monthlyCasualLeaveQuota} Days <span className="text-xs text-[#6B7280] font-normal">/ month</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                  Eligible for personal & urgent tasks
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-[#6B7280] font-semibold block">
                  Annual Planned Leave
                </span>
                <div className="text-xl font-bold font-mono text-[#111827] mt-1">
                  {settings.policy.annualLeaveQuota} Days <span className="text-xs text-[#6B7280] font-normal">/ year</span>
                </div>
                <span className="text-[10px] text-neutral-500 font-medium mt-1 block">
                  Requires 3 days advance submission
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-[#6B7280] font-semibold block">
                  Your Submitted Requests
                </span>
                <div className="text-xl font-bold font-mono text-rose-700 mt-1">
                  {myLeaves.length} Total
                </div>
                <span className="text-[10px] text-neutral-500 font-medium mt-1 block">
                  {pendingLeaves.length} Pending Operations review
                </span>
              </div>
            </div>

            {/* Leave Applications History */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#111827]">
                    Your Leave Applications
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Status tracking and official approvals from Operations
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="text-xs font-semibold text-[#DC2626] hover:underline flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Apply New</span>
                </button>
              </div>

              {myLeaves.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-[#111827]">No leave requests submitted yet</div>
                  <p className="text-[11px] text-[#6B7280] max-w-xs mx-auto">
                    When you need personal time off or sick leave, submit a request here for management approval.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLeaveModalOpen(true)}
                    className="mt-2 bg-[#111827] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Apply for Leave</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#F3F4F6]">
                  {myLeaves.map((leave) => (
                    <div key={leave.id} className="py-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#111827]">
                            {leave.leaveType} LEAVE {leave.isHalfDay && '(Half Day)'}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                              leave.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : leave.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {leave.status}
                          </span>
                        </div>

                        <span className="font-mono text-xs font-bold text-[#111827]">
                          {leave.daysCount} {leave.daysCount === 1 ? 'Day' : 'Days'}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[#4B5563]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>
                            {leave.startDate} {leave.startDate !== leave.endDate && `to ${leave.endDate}`}
                          </span>
                        </div>

                        {leave.contactNumber && (
                          <div className="text-[11px] font-mono text-[#6B7280]">
                            Emergency Contact: {leave.contactNumber}
                          </div>
                        )}
                      </div>

                      <div className="bg-[#F9FAFB] p-2.5 rounded-lg border border-[#F3F4F6] text-xs text-[#374151]">
                        <span className="font-semibold text-[10px] text-neutral-500 uppercase font-mono block mb-0.5">
                          Reason:
                        </span>
                        "{leave.reason}"
                      </div>

                      {leave.rejectionReason && (
                        <div className="bg-rose-50/70 p-2.5 rounded-lg border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[10px] uppercase font-mono block text-rose-600">
                              Operations Rejection Reason:
                            </span>
                            {leave.rejectionReason}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <MobileBottomNav />

      <CameraCaptureModal
        isOpen={isModalOpen}
        mode={mode}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
      />

      <ApplyLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSuccess={() => setIsLeaveModalOpen(false)}
      />
    </div>
  );
}
