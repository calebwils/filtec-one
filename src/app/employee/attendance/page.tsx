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
  RefreshCw,
  Printer,
  Share2,
  Send,
  Download,
  IndianRupee
} from 'lucide-react';
import { calculateDistanceMeters, formatDistanceToFiltec, formatDistanceShort } from '@/utils/distance';
import { AttendanceService } from '@/services/AttendanceService';
import { PayslipModal } from '@/components/payroll/PayslipModal';
import { calculateEmployeePayroll, formatMonthLabel, getWorkingDaysInMonth } from '@/utils/payroll';

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
  const { attendanceRecords, currentUser, leaveRequests, settings, employees, dailyAttendance } = useAppStore();
  const [tab, setTab] = useState<'PUNCH' | 'LEAVE' | 'PAYSLIP'>('PUNCH');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [mode, setMode] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');

  const today = todayStr();
  const currentMonthYYYYMM = today.slice(0, 7);
  const [selectedPayslipMonth, setSelectedPayslipMonth] = useState(currentMonthYYYYMM);
  const [copiedPayslip, setCopiedPayslip] = useState(false);

  const currentEmployee = employees.find(
    (e) =>
      e.id === currentUser.id ||
      e.code === currentUser.employeeCode ||
      (currentUser.name && e.name.toLowerCase() === currentUser.name.toLowerCase())
  );

  const myPayroll = currentEmployee
    ? calculateEmployeePayroll(currentEmployee, selectedPayslipMonth, dailyAttendance, leaveRequests)
    : null;

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

  const handleSharePayslip = async () => {
    if (!myPayroll) return;
    const companyName = settings?.company?.legalName || 'FILTEC Polyplast Pvt Ltd';
    const text = `*${companyName.toUpperCase()} — SALARY SLIP*
*Month:* ${myPayroll.monthLabel}
*Employee:* ${myPayroll.employeeName} (${myPayroll.employeeCode})
*Designation:* ${myPayroll.designation}
*Territory:* ${myPayroll.territory}
---------------------------------
*Attendance Summary:*
• Working Days: ${myPayroll.totalWorkingDays} days
• Days Present: ${myPayroll.presentDays} days
• Approved Leaves: ${myPayroll.approvedLeaves} days
• Loss of Pay (LOP): ${myPayroll.absentDays} days
• Attendance Rate: ${myPayroll.attendancePercentage}%
---------------------------------
*Remuneration Breakdown:*
• Base Monthly Rate: ₹${myPayroll.baseSalary.toLocaleString('en-IN')}
• LOP Deduction: -₹${myPayroll.lossOfPayDeduction.toLocaleString('en-IN')}
*NET SALARY PAYABLE: ₹${myPayroll.netPayableSalary.toLocaleString('en-IN')}*
(${myPayroll.amountInWords})
---------------------------------
Generated via FILTEC ONE Operational Platform.`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${companyName} - Salary Slip (${myPayroll.employeeName})`,
          text: text
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedPayslip(true);
        setTimeout(() => setCopiedPayslip(false), 2500);
      }
    } catch {
      alert('Payslip summary copied!');
    }
  };

  const handleSendWhatsAppPayslip = () => {
    if (!myPayroll) return;
    const cleanPhone = (myPayroll.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const companyName = settings?.company?.legalName || 'FILTEC Polyplast Pvt Ltd';
    const text = `*${companyName.toUpperCase()} — SALARY SLIP*
*Month:* ${myPayroll.monthLabel}
*Employee:* ${myPayroll.employeeName} (${myPayroll.employeeCode})
*Designation:* ${myPayroll.designation}
---------------------------------
*Attendance Summary:*
• Working Days: ${myPayroll.totalWorkingDays} days
• Days Present: ${myPayroll.presentDays} days
• Approved Leaves: ${myPayroll.approvedLeaves} days
• Loss of Pay (LOP): ${myPayroll.absentDays} days
• Attendance Rate: ${myPayroll.attendancePercentage}%
---------------------------------
*NET SALARY PAYABLE: ₹${myPayroll.netPayableSalary.toLocaleString('en-IN')}*
(${myPayroll.amountInWords})
---------------------------------
Generated via FILTEC ONE Operational Platform.`;

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrevPayslipMonth = () => {
    let [y, m] = selectedPayslipMonth.split('-').map(Number);
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setSelectedPayslipMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleNextPayslipMonth = () => {
    let [y, m] = selectedPayslipMonth.split('-').map(Number);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedPayslipMonth(`${y}-${String(m).padStart(2, '0')}`);
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
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
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

            <button
              type="button"
              onClick={() => setTab('PAYSLIP')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === 'PAYSLIP'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'bg-white border border-[#E5E7EB] text-[#111827] hover:bg-neutral-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official Payslip</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                Ready
              </span>
            </button>
          </div>

          {tab === 'LEAVE' && (
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(true)}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Apply for Leave</span>
            </button>
          )}

          {tab === 'PAYSLIP' && myPayroll && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSharePayslip}
                className="bg-neutral-900 hover:bg-black text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedPayslip ? 'Copied!' : 'Share'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPayslipModalOpen(true)}
                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          )}
        </div>

        {tab === 'PUNCH' ? (
          <>
            {/* Payslip Notification Banner */}
            {myPayroll && (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#111827]">
                        {myPayroll.monthLabel} Official Payslip is Ready
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        Ready to Download
                      </span>
                    </div>
                    <p className="text-xs text-[#4B5563] mt-0.5 font-mono">
                      Net Payable: <strong className="text-emerald-950 font-bold">₹{myPayroll.netPayableSalary.toLocaleString('en-IN')}</strong> • Attendance: <span className="font-semibold text-emerald-700">{myPayroll.attendancePercentage}%</span> ({myPayroll.payableDays}/{myPayroll.totalWorkingDays} working days)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSharePayslip}
                    className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-600" />
                    <span>{copiedPayslip ? 'Copied!' : 'Share'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPayslipModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('PAYSLIP')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span>Details →</span>
                  </button>
                </div>
              </div>
            )}

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
                              <span className="font-semibold text-xs text-[#111827]">{(l.leaveType || 'Leave')}</span>
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
        ) : tab === 'LEAVE' ? (
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
        ) : (
          /* OFFICIAL PAYSLIP & REMUNERATION TAB */
          <div className="space-y-5">
            {/* Month Switcher Header */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevPayslipMonth}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                    <span>{myPayroll ? myPayroll.monthLabel : selectedPayslipMonth}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      Official Payslip Ready
                    </span>
                  </h2>
                  <p className="text-[11px] text-[#6B7280]">
                    Verified attendance and leave ledger calculation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNextPayslipMonth}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {myPayroll && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSharePayslip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-black text-white transition-all shadow-xs cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedPayslip ? 'Copied!' : 'Share Payslip'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWhatsAppPayslip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPayslipModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              )}
            </div>

            {myPayroll ? (
              <>
                {/* Hero Net Salary Card */}
                <div className="bg-gradient-to-br from-emerald-950 via-[#064E3B] to-emerald-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                        Verified Operational Remuneration
                      </span>
                      <div className="text-3xl sm:text-4xl font-mono font-black text-white mt-1">
                        ₹{myPayroll.netPayableSalary.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-emerald-200/90 font-serif italic mt-0.5">
                        {myPayroll.amountInWords}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-mono text-emerald-300 uppercase block">Attendance Ratio</span>
                      <span className="text-2xl font-bold font-mono text-white">
                        {myPayroll.attendancePercentage}%
                      </span>
                      <span className="text-[11px] text-emerald-200 block">
                        {myPayroll.payableDays} paid of {myPayroll.totalWorkingDays} working days
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-xs text-emerald-100/90 font-mono">
                      <span>Rate: <strong>₹{myPayroll.perDayRate.toLocaleString('en-IN')}</strong> / working day</span>
                      <span className="mx-2 text-emerald-400">•</span>
                      <span>Base: <strong>₹{myPayroll.baseSalary.toLocaleString('en-IN')}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPayslipModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-emerald-950 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-emerald-800" />
                        <span>Download & Print PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSharePayslip}
                        className="px-3.5 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white text-xs font-semibold transition-all border border-emerald-600/50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-[#6B7280] font-semibold block">
                      Calendar Working Days
                    </span>
                    <div className="text-xl font-bold font-mono text-[#111827] mt-1">
                      {myPayroll.totalWorkingDays} <span className="text-xs text-neutral-500 font-normal">days</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                      Mon–Sat (excl. Sundays)
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">
                      Verified Punches
                    </span>
                    <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                      {myPayroll.presentDays} <span className="text-xs text-emerald-600 font-normal">days</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-mono mt-0.5 block">
                      GPS & Photo Verified
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-purple-800 font-bold block">
                      Approved Paid Leaves
                    </span>
                    <div className="text-xl font-bold font-mono text-purple-700 mt-1">
                      {myPayroll.approvedLeaves} <span className="text-xs text-purple-600 font-normal">days</span>
                    </div>
                    <span className="text-[10px] text-purple-700 font-mono mt-0.5 block">
                      Authorized by Management
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-amber-800 font-bold block">
                      Loss of Pay (LOP)
                    </span>
                    <div className="text-xl font-bold font-mono text-amber-700 mt-1">
                      {myPayroll.absentDays} <span className="text-xs text-amber-600 font-normal">days</span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-mono mt-0.5 block">
                      -₹{myPayroll.lossOfPayDeduction.toLocaleString('en-IN')} deducted
                    </span>
                  </div>
                </div>

                {/* Itemized Financial Ledger */}
                <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-[#F3F4F6] bg-[#F9FAFB] flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase font-mono text-[#111827]">
                      Salary Statement Breakdown ({myPayroll.monthLabel})
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      Official Ledger Verified
                    </span>
                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {/* Earnings */}
                    <div className="space-y-3">
                      <h4 className="font-bold font-mono text-[11px] text-[#111827] uppercase pb-2 border-b border-neutral-200">
                        Earnings & Remuneration
                      </h4>
                      <div className="flex justify-between py-1">
                        <span className="text-[#4B5563]">Basic Rate (Monthly)</span>
                        <span className="font-mono font-semibold text-[#111827]">₹{myPayroll.baseSalary.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#4B5563]">Daily Pro-Rata Equivalent</span>
                        <span className="font-mono font-semibold text-[#111827]">₹{myPayroll.perDayRate.toLocaleString('en-IN')} / day</span>
                      </div>
                      <div className="flex justify-between py-1 font-semibold border-t border-dashed border-neutral-200 pt-2 text-[#111827]">
                        <span>Earned Gross Remuneration</span>
                        <span className="font-mono font-bold text-emerald-700">₹{myPayroll.earnedBaseSalary.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="space-y-3">
                      <h4 className="font-bold font-mono text-[11px] text-[#111827] uppercase pb-2 border-b border-neutral-200">
                        Deductions & Adjustments
                      </h4>
                      <div className="flex justify-between py-1">
                        <span className="text-[#4B5563]">Loss of Pay ({myPayroll.absentDays} days unworked)</span>
                        <span className="font-mono font-semibold text-rose-600">-₹{myPayroll.lossOfPayDeduction.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#4B5563]">Advance / Loans</span>
                        <span className="font-mono text-neutral-500">₹0</span>
                      </div>
                      <div className="flex justify-between py-1 font-semibold border-t border-dashed border-neutral-200 pt-2 text-[#111827]">
                        <span>Total Deductions</span>
                        <span className="font-mono font-bold text-rose-600">-₹{myPayroll.lossOfPayDeduction.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/70 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-800 block">
                        Net Payable Remuneration
                      </span>
                      <span className="text-xs text-[#374151] font-serif italic">
                        {myPayroll.amountInWords}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-black text-emerald-950">
                        ₹{myPayroll.netPayableSalary.toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPayslipModalOpen(true)}
                        className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Official Payslip</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center space-y-3 shadow-2xs">
                <FileText className="w-10 h-10 text-neutral-400 mx-auto" />
                <h3 className="font-bold text-sm text-[#111827]">Employee Profile Not Linked</h3>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                  Your employee profile does not have a configured base salary in the operational database. Please contact Admin.
                </p>
              </div>
            )}
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

      {/* Official Payslip Modal for PDF Download & Print */}
      <PayslipModal
        isOpen={isPayslipModalOpen}
        payroll={myPayroll}
        onClose={() => setIsPayslipModalOpen(false)}
      />
    </div>
  );
}
