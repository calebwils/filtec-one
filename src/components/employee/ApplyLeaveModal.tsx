'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Send,
  Sparkles
} from 'lucide-react';
import { useAppStore, store } from '@/data/store';
import { LeaveRequest } from '@/types';

export function ApplyLeaveModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (leave: LeaveRequest) => void;
}) {
  const { currentUser, settings, leaveRequests } = useAppStore();

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    leaveType: 'CASUAL' as 'CASUAL' | 'SICK' | 'PLANNED' | 'COMPENSATORY',
    startDate: todayStr,
    endDate: todayStr,
    isHalfDay: false,
    reason: '',
    contactNumber: currentUser.phone || '9437860619'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successLeave, setSuccessLeave] = useState<LeaveRequest | null>(null);

  if (!isOpen) return null;

  // Calculate days count
  const calculateDays = () => {
    if (formData.isHalfDay && formData.startDate === formData.endDate) {
      return 0.5;
    }
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return 1;
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const daysCount = calculateDays();

  // Employee's leaves this month
  const thisMonthStr = todayStr.substring(0, 7);
  const leavesThisMonth = leaveRequests.filter(
    (l) =>
      (l.employeeId === currentUser.id || l.employeeName === currentUser.name) &&
      l.startDate.startsWith(thisMonthStr) &&
      l.status !== 'REJECTED'
  ).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const created = store.submitLeaveRequest({
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        daysCount,
        isHalfDay: formData.isHalfDay,
        reason: formData.reason.trim(),
        contactNumber: formData.contactNumber.trim()
      });

      setIsSubmitting(false);
      setSuccessLeave(created);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(created);
        }
        onClose();
        setSuccessLeave(null);
      }, 1200);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#111827] text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#111827]">Apply for Leave</h3>
              <p className="text-xs text-[#6B7280]">
                {currentUser.name} • {currentUser.employeeCode || 'FPPL/OD-002'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-200 text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successLeave ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-[#111827]">Leave Application Submitted!</h4>
            <p className="text-xs text-[#6B7280] max-w-xs mx-auto">
              Your request for <strong>{daysCount} day(s)</strong> ({formData.startDate} to {formData.endDate}) has been transmitted to Operations. You will receive WhatsApp confirmation upon approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Policy & Quota Micro Bar */}
            <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#6B7280] block font-semibold">
                  Monthly Quota
                </span>
                <span className="font-bold text-[#111827]">
                  {settings.policy.monthlyCasualLeaveQuota} Casual Days / Month
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-[#6B7280] block font-semibold">
                  Used This Month
                </span>
                <span className="font-bold text-neutral-800 font-mono">
                  {leavesThisMonth} Request(s)
                </span>
              </div>
            </div>

            {/* Leave Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-2">
                Select Leave Category <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'CASUAL',
                    label: 'Casual Leave',
                    desc: 'Personal or urgent errands'
                  },
                  {
                    id: 'SICK',
                    label: 'Sick Leave',
                    desc: 'Medical recovery & health'
                  },
                  {
                    id: 'PLANNED',
                    label: 'Planned Leave',
                    desc: 'Scheduled annual vacation'
                  },
                  {
                    id: 'COMPENSATORY',
                    label: 'Duty Off (Comp)',
                    desc: 'Weekend / holiday duty'
                  }
                ].map((type) => {
                  const isSelected = formData.leaveType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          leaveType: type.id as any
                        })
                      }
                      className={`p-2.5 text-left rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#DC2626] bg-rose-50/50 text-[#111827] shadow-2xs'
                          : 'border-[#E5E7EB] hover:border-neutral-300 text-[#4B5563]'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>{type.label}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#DC2626]" />}
                      </div>
                      <span className="text-[10px] text-[#6B7280] block mt-0.5 leading-tight">
                        {type.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dates Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Start Date <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setFormData({
                      ...formData,
                      startDate: newStart,
                      endDate: formData.endDate < newStart ? newStart : formData.endDate
                    });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  End Date <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={formData.startDate}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] font-mono"
                />
              </div>
            </div>

            {/* Half Day Option if Single Date */}
            {formData.startDate === formData.endDate && (
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="halfDay"
                  checked={formData.isHalfDay}
                  onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                  className="rounded border-[#D1D5DB] text-[#DC2626] focus:ring-[#DC2626] w-3.5 h-3.5"
                />
                <label htmlFor="halfDay" className="text-xs text-[#374151] cursor-pointer">
                  Half-day leave (First / Second half)
                </label>
              </div>
            )}

            {/* Calculated Duration Badge */}
            <div className="bg-neutral-100 px-3 py-2 rounded-lg flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">Total Duration Requested:</span>
              <span className="font-bold text-[#111827] font-mono">
                {daysCount} {daysCount === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Reason & Handover Details <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Explain purpose and territory dealer coverage handover..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              />
            </div>

            {/* Emergency Phone during leave */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Emergency Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="Contact number during absence"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] font-mono"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#4B5563] hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.reason.trim()}
                className="bg-[#111827] hover:bg-black disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Leave Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
