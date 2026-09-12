'use client';

import React, { useState } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { CameraCaptureModal } from '@/components/attendance/CameraCaptureModal';
import { ApplyLeaveModal } from '@/components/employee/ApplyLeaveModal';
import { useAppStore } from '@/data/store';
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
  FileText
} from 'lucide-react';

export default function AttendancePage() {
  const { attendanceRecords, currentUser, leaveRequests, settings } = useAppStore();
  const [tab, setTab] = useState<'PUNCH' | 'LEAVE'>('PUNCH');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [mode, setMode] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');

  const latestRecord = attendanceRecords[0];

  const myLeaves = leaveRequests.filter(
    (l) => l.employeeId === currentUser.id || l.employeeName === currentUser.name
  );
  const pendingLeaves = myLeaves.filter((l) => l.status === 'PENDING');

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
                    }}
                    className="flex-1 sm:flex-initial bg-[#111827] hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Record Check-In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('CHECK_OUT');
                      setIsModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial border border-[#E5E7EB] hover:bg-neutral-50 text-[#111827] text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Check-Out</span>
                  </button>
                </div>
              </div>

              {/* Current Status Details */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                  <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Employee</span>
                  <div className="font-semibold text-xs text-[#111827] mt-0.5">{currentUser.name}</div>
                  <span className="text-[10px] font-mono text-[#6B7280]">{currentUser.employeeCode || 'FPPL/OD-002'}</span>
                </div>

                <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Last Status</span>
                    <div className="font-semibold text-xs text-[#111827] mt-0.5">
                      {latestRecord ? (latestRecord.type === 'CHECK_IN' ? 'Checked In' : 'Checked Out') : 'None'}
                    </div>
                    <span className="text-[10px] font-mono text-[#6B7280]">
                      {latestRecord ? new Date(latestRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Awaiting punch'}
                    </span>
                  </div>
                  {latestRecord?.photoUrl && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E5E7EB] bg-neutral-900 shrink-0">
                      <img src={latestRecord.photoUrl} alt="Verified Selfie" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                  <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Last Verified Location</span>
                  <div className="font-semibold text-xs text-[#111827] mt-0.5 truncate" title={latestRecord?.locationName}>
                    {latestRecord ? latestRecord.locationName : 'No GPS record'}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">Real GPS Verified</span>
                </div>
              </div>
            </div>

            {/* Verification History Log */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase font-mono text-[#111827] mb-3">
                Recent Attendance Records
              </h3>

              <div className="divide-y divide-[#F3F4F6]">
                {attendanceRecords.map((record) => (
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
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#111827]">
                            {record.type === 'CHECK_IN' ? 'Check-In Punch' : 'Check-Out Punch'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            Real Photo Verified
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
                ))}
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
