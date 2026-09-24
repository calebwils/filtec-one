'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  Send,
  MapPin,
  Phone,
  FileText
} from 'lucide-react';
import { EmployeePayrollCalculation } from '@/utils/payroll';
import { useAppStore } from '@/data/store';

export function PayslipModal({
  isOpen,
  payroll,
  onClose
}: {
  isOpen: boolean;
  payroll: EmployeePayrollCalculation | null;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const { settings } = useAppStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const company = settings?.company || {};
  const companyLegalName = company.legalName || 'FILTEC Polyplast Pvt Ltd';
  const plantAddress = company.plantAddress || 'Water Park Rd, Kurangsasan, Odisha 754002, India';
  const companyPhone = company.phone || '+91 9437505814';
  const companyEmail = company.supportEmail || 'care@filtec.in';
  const companyGstin = company.gstin || '21AAGCF5549N1ZC';

  if (!isOpen || !payroll || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = (payroll.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    const text = `*${companyLegalName.toUpperCase()} — SALARY SLIP*
*Month:* ${payroll.monthLabel}
*Employee:* ${payroll.employeeName} (${payroll.employeeCode})
*Designation:* ${payroll.designation}
*Territory:* ${payroll.territory}
---------------------------------
*Attendance Summary:*
• Working Days: ${payroll.totalWorkingDays} days
• Days Present: ${payroll.presentDays} days
• Approved Leaves: ${payroll.approvedLeaves} days
• Loss of Pay (LOP): ${payroll.absentDays} days
• Attendance Rate: ${payroll.attendancePercentage}%
---------------------------------
*Remuneration Breakdown:*
• Base Monthly Rate: ₹${payroll.baseSalary.toLocaleString('en-IN')}
• LOP Deduction: -₹${payroll.lossOfPayDeduction.toLocaleString('en-IN')}
*NET SALARY PAYABLE: ₹${payroll.netPayableSalary.toLocaleString('en-IN')}*
(${payroll.amountInWords})
---------------------------------
*Works & Plant:* ${plantAddress}
Phone: ${companyPhone} • Email: ${companyEmail}
Generated via FILTEC ONE Operational Platform.`;

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const modalContent = (
    <div
      id="filtec-payslip-print-portal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:inset-auto print:z-0 print:overflow-visible print:block"
    >
      {/* Modal Container */}
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-auto flex flex-col max-h-[94vh] print:max-w-none print:w-full print:shadow-none print:border-none print:my-0 print:max-h-none print:rounded-none">
        {/* Top Action Bar (hidden when printing) */}
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#111827]">Official Salary Slip</h3>
              <p className="text-[10px] text-[#6B7280]">
                {payroll.employeeName} • {payroll.monthLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111827] hover:bg-black text-white transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-[#111827] hover:bg-neutral-200 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div
          ref={printRef}
          id="filtec-printable-payslip"
          className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[#111827] bg-white print:p-0 print:overflow-visible"
        >
          {/* Header */}
          <div className="border-b-2 border-[#111827] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              {/* Official Brand Logo */}
              <div className="pb-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/filtec-logo.svg"
                  alt="FILTEC"
                  className="h-10 sm:h-11 w-auto object-contain"
                />
              </div>
              <div className="text-xs font-bold uppercase text-[#111827] tracking-wider">
                {companyLegalName}
              </div>
              <p className="text-[11px] text-[#4B5563] font-medium max-w-sm">
                Manufacturers of Premium PPR Pipes, Plumbing Systems & Water Technology
              </p>
              <p className="text-[10px] text-[#6B7280] font-mono">
                Works & Plant: {plantAddress}
              </p>
              <p className="text-[10px] text-[#6B7280] font-mono">
                Phone: {companyPhone} • Email: {companyEmail}
                {companyGstin ? ` • GSTIN: ${companyGstin}` : ''}
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-neutral-200 sm:pl-4 space-y-1">
              <div className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#DC2626]">
                Confidential Payslip
              </div>
              <div className="text-sm font-black font-mono text-[#111827]">
                {payroll.monthLabel.toUpperCase()}
              </div>
              <div className="text-[10px] font-mono text-[#6B7280]">
                Ref: PAY-{payroll.month.replace('-', '')}-{payroll.employeeCode.replace(/[^A-Za-z0-9]/g, '')}
              </div>
            </div>
          </div>

          {/* Employee Information Grid */}
          <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#6B7280] block">Employee Name</span>
                <span className="font-bold text-[#111827] text-xs">{payroll.employeeName}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#6B7280] block">Staff Code</span>
                <span className="font-mono font-bold text-xs text-[#DC2626]">{payroll.employeeCode}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#6B7280] block">Designation</span>
                <span className="font-medium text-[#111827]">{payroll.designation}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#6B7280] block">Territory / Unit</span>
                <span className="font-medium text-[#111827]">{payroll.territory}</span>
              </div>
            </div>
          </div>

          {/* Attendance Breakdown Card */}
          <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111827] text-white px-3.5 py-1.5 text-[11px] font-bold uppercase font-mono">
              <span>Verified Attendance Summary (Mon–Sat Working Days)</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-[#E5E7EB] bg-[#F8F9FA] text-center text-xs">
              <div className="p-2.5">
                <span className="text-[10px] font-mono text-[#6B7280] block">Calendar Days</span>
                <span className="font-bold font-mono text-sm text-[#111827]">{payroll.calendarDays}</span>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] font-mono text-[#6B7280] block">Working Days</span>
                <span className="font-bold font-mono text-sm text-[#111827]">{payroll.totalWorkingDays}</span>
              </div>
              <div className="p-2.5 bg-emerald-50/60">
                <span className="text-[10px] font-mono text-emerald-800 block">GPS Present</span>
                <span className="font-bold font-mono text-sm text-emerald-700">{payroll.presentDays}</span>
              </div>
              <div className="p-2.5 bg-amber-50/60">
                <span className="text-[10px] font-mono text-amber-800 block">Paid Leaves</span>
                <span className="font-bold font-mono text-sm text-amber-700">{payroll.approvedLeaves}</span>
              </div>
              <div className="p-2.5 bg-rose-50/60">
                <span className="text-[10px] font-mono text-rose-800 block">Loss of Pay (LOP)</span>
                <span className="font-bold font-mono text-sm text-rose-700">{payroll.absentDays}</span>
              </div>
              <div className="p-2.5 bg-blue-50/60">
                <span className="text-[10px] font-mono text-blue-800 block">Payable Days</span>
                <span className="font-bold font-mono text-sm text-blue-900">{payroll.payableDays}</span>
              </div>
            </div>
          </div>

          {/* Earnings vs Deductions Table */}
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 bg-[#F8F9FA] border-b border-[#E5E7EB] text-xs font-mono font-bold">
              <div className="p-2.5 border-r border-[#E5E7EB] uppercase text-[#111827]">
                Earnings & Allowances
              </div>
              <div className="p-2.5 uppercase text-[#111827]">
                Deductions & Adjustments
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-[#E5E7EB] text-xs">
              {/* Earnings Column */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#4B5563]">Basic Salary (Monthly Rate)</span>
                  <span className="font-mono text-neutral-500">₹{payroll.baseSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-[#111827]">Earned Base Pay ({payroll.payableDays} / {payroll.totalWorkingDays} days)</span>
                  <span className="font-mono font-bold text-[#111827]">₹{payroll.earnedBaseSalary.toLocaleString('en-IN')}</span>
                </div>
                {payroll.fieldAllowance > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#4B5563]">Field Travel & Daily Allowance</span>
                    <span className="font-mono font-medium text-[#111827]">₹{payroll.fieldAllowance.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between font-bold text-xs">
                  <span>Gross Earnings</span>
                  <span className="font-mono text-emerald-700">₹{payroll.grossEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#4B5563]">Loss of Pay ({payroll.absentDays} days unexcused)</span>
                  <span className="font-mono text-rose-700">
                    {payroll.lossOfPayDeduction > 0 ? `-₹${payroll.lossOfPayDeduction.toLocaleString('en-IN')}` : '₹0'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Advance / Loan Adjustments</span>
                  <span className="font-mono">₹0</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>TDS / Professional Tax</span>
                  <span className="font-mono">₹0</span>
                </div>
                <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between font-bold text-xs">
                  <span>Total Deductions</span>
                  <span className="font-mono text-rose-700">₹{payroll.totalDeductions.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Net Pay Total Bar */}
            <div className="p-4 bg-emerald-50/70 border-t-2 border-[#111827] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-800 block">
                  Net Salary Payable Remuneration
                </span>
                <span className="text-xs text-[#374151] font-serif italic">
                  {payroll.amountInWords}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-black text-emerald-950">
                  ₹{payroll.netPayableSalary.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Footnote & Signatures */}
          <div className="pt-4 border-t border-dashed border-[#D1D5DB] flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-[10px] text-[#6B7280]">
            <div className="space-y-1 max-w-sm">
              <div className="flex items-center gap-1 text-emerald-800 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified by FILTEC ONE Operational Ledger</span>
              </div>
              <p className="leading-relaxed">
                This is a computer-generated payslip computed from immutable GPS check-in attendance records and approved leave logs. No physical signature required.
              </p>
            </div>

            <div className="text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
              <div className="h-10 flex items-end justify-center sm:justify-end">
                <span className="font-serif italic text-neutral-700 text-xs">For {companyLegalName.toUpperCase()}</span>
              </div>
              <span className="block border-t border-neutral-400 pt-1 font-mono text-[10px] font-semibold text-neutral-800 uppercase">
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden when printing) */}
        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between shrink-0 print:hidden text-xs">
          <span className="text-[11px] text-[#6B7280] font-mono">
            Rate: ₹{payroll.perDayRate.toLocaleString('en-IN')} / working day
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold bg-neutral-200 hover:bg-neutral-300 text-[#111827] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
