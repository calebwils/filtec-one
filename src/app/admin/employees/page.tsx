'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore, store } from '@/data/store';
import {
  Users,
  Search,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Radio,
  FileCheck,
  UserPlus,
  Pencil,
  XCircle,
  Shield,
  UserCheck,
  Sliders
} from 'lucide-react';
import { OnboardEmployeeModal } from '@/components/admin/OnboardEmployeeModal';
import { EditEmployeeModal } from '@/components/admin/EditEmployeeModal';
import { Employee } from '@/types';

export default function AdminEmployeesPage() {
  const { employees, leaveRequests } = useAppStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'ROSTER' | 'LEAVE'>('ROSTER');
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<Employee | null>(null);
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'EMPLOYEE'>('ALL');

  const adminCount = employees.filter((e) => e.systemRole === 'ADMIN').length;
  const staffCount = employees.filter((e) => e.systemRole !== 'ADMIN').length;

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.territory && e.territory.toLowerCase().includes(search.toLowerCase())) ||
      (e.designation && e.designation.toLowerCase().includes(search.toLowerCase())) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      (e.remarks && e.remarks.toLowerCase().includes(search.toLowerCase()));

    const matchesRole =
      roleFilter === 'ALL'
        ? true
        : roleFilter === 'ADMIN'
        ? e.systemRole === 'ADMIN'
        : e.systemRole !== 'ADMIN';

    return matchesSearch && matchesRole;
  });

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'PENDING');

  const handleApproveLeave = (id: string) => {
    store.approveLeaveRequest(id);
  };

  const handleRejectLeave = (id: string) => {
    store.rejectLeaveRequest(id, rejectionReason || 'Operational requirements at depot');
    setRejectingLeaveId(null);
    setRejectionReason('');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Employee Management" subtitle="Field Personnel & Targets" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Field Personnel & Performance</h2>
            <p className="text-xs text-[#6B7280]">
              Territory coverage, monthly sales targets, verified check-in statuses, and leave administration
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOnboardModalOpen(true)}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Onboard Employee</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('ROSTER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === 'ROSTER'
                  ? 'bg-[#111827] text-white'
                  : 'bg-white border border-[#E5E7EB] text-[#4B5563]'
              }`}
            >
              Staff Directory ({employees.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('LEAVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                tab === 'LEAVE'
                  ? 'bg-[#111827] text-white'
                  : 'bg-white border border-[#E5E7EB] text-[#4B5563]'
              }`}
            >
              <span>Leave Requests</span>
              {pendingLeaves.length > 0 && (
                <span className="bg-[#DC2626] text-white text-[10px] px-1.5 rounded-full font-mono">
                  {pendingLeaves.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {tab === 'ROSTER' && (
          <div className="space-y-4">
            {/* Search & Overview bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, designation, ID, phone..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setRoleFilter('ALL')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                      roleFilter === 'ALL'
                        ? 'bg-white text-neutral-900 shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    All Staff ({employees.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('ADMIN')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                      roleFilter === 'ADMIN'
                        ? 'bg-[#DC2626] text-white shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    <span>Admins ({adminCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('EMPLOYEE')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                      roleFilter === 'EMPLOYEE'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Field Reps ({staffCount})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Employee Master Data - Table List View */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F3F4F6] flex items-center justify-between bg-[#F9FAFB]">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#111827]">
                    Employee Master Data
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">Official personnel directory and operational roster</p>
                </div>
                <span className="text-[10px] font-mono text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                  Real Staff Ledger • {filteredEmployees.length} Records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] uppercase font-mono text-[10px]">
                      <th className="py-3 px-3 text-center w-12 whitespace-nowrap">Sr. No.</th>
                      <th className="py-3 px-3 whitespace-nowrap min-w-[140px]">Employee ID</th>
                      <th className="py-3 px-4 whitespace-nowrap">Name & Designation</th>
                      <th className="py-3 px-3 whitespace-nowrap">System Role & Access</th>
                      <th className="py-3 px-4 whitespace-nowrap">Contact</th>
                      <th className="py-3 px-3 whitespace-nowrap">Territory</th>
                      <th className="py-3 px-3 whitespace-nowrap">Target / Sales</th>
                      <th className="py-3 px-3 whitespace-nowrap">Remarks</th>
                      <th className="py-3 px-3 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {filteredEmployees.map((emp, index) => {
                      const hasTarget = (emp.targetMonthly || 0) > 0;
                      const hasSales = (emp.currentMonthSales || 0) > 0;
                      const isTerritoryEmpty = !emp.territory || emp.territory === '(-)' || emp.territory.trim() === '';
                      const isRemarksEmpty = !emp.remarks || emp.remarks === '(-)' || emp.remarks.trim() === '';

                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-neutral-50/80 transition-colors group"
                        >
                          {/* Sr. No. */}
                          <td className="py-3 px-3 text-center font-mono font-medium text-neutral-500 text-[11px]">
                            {index + 1}
                          </td>

                          {/* Employee ID */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="tech-code font-bold text-xs bg-[#111827] text-white px-2.5 py-1 rounded font-mono whitespace-nowrap inline-block">
                              {emp.code}
                            </span>
                          </td>

                          {/* Name of Employee & Designation */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-sm text-[#111827]">
                              {emp.name}
                            </div>
                            <div className="text-[11px] font-medium text-neutral-600 mt-0.5">
                              {emp.designation || '(-)'}
                              {emp.baseSalary && emp.baseSalary > 0 ? (
                                <span className="text-neutral-400 font-normal"> • ₹{(emp.baseSalary / 1000).toFixed(0)}k/mo</span>
                              ) : null}
                            </div>
                          </td>

                          {/* System Role & Page Access */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {(() => {
                              const adminPagesCount = (emp.allowedPages || []).filter((p) =>
                                p.startsWith('/admin')
                              ).length;
                              const fieldPagesCount = (emp.allowedPages || []).filter((p) =>
                                p.startsWith('/employee')
                              ).length;

                              if (emp.systemRole === 'ADMIN') {
                                return (
                                  <div>
                                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[10px] font-mono px-2 py-0.5 rounded border border-rose-200 font-bold">
                                      <Shield className="w-3 h-3 text-rose-600" />
                                      ADMIN
                                    </span>
                                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                      {adminPagesCount || 10} Admin Pages
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div>
                                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-200 font-semibold">
                                    <UserCheck className="w-3 h-3 text-blue-600" />
                                    EMPLOYEE
                                  </span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {adminPagesCount > 0 ? (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.2 rounded">
                                        <Shield className="w-2.5 h-2.5 text-rose-600" />
                                        +{adminPagesCount} Admin
                                      </span>
                                    ) : null}
                                    <span className="text-[10px] text-neutral-500 font-mono">
                                      {fieldPagesCount || 5} Field Pages
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-mono text-xs text-[#111827]">
                              <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <a
                                href={`tel:${emp.phone}`}
                                className="hover:text-[#DC2626] transition-colors"
                              >
                                {emp.phone}
                              </a>
                            </div>
                            {emp.email && emp.email !== '(-)' && (
                              <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">
                                {emp.email}
                              </div>
                            )}
                          </td>

                          {/* Territory */}
                          <td className="py-3 px-3">
                            {isTerritoryEmpty ? (
                              <span className="font-mono text-neutral-400 font-medium">(-)</span>
                            ) : (
                              <div className="flex items-center gap-1 text-neutral-700">
                                <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                                <span className="font-medium">{emp.territory}</span>
                              </div>
                            )}
                          </td>

                          {/* Target / Sales */}
                          <td className="py-3 px-3">
                            {!hasTarget && !hasSales ? (
                              <span className="font-mono text-neutral-400 font-medium">(-)</span>
                            ) : (
                              <div className="space-y-0.5 font-mono text-[11px]">
                                <div className="text-[#111827] font-semibold">
                                  ₹{((emp.targetMonthly || 0) / 1000).toFixed(0)}k Target
                                </div>
                                <div className="text-emerald-700 text-[10px]">
                                  ₹{((emp.currentMonthSales || 0) / 1000).toFixed(0)}k Achieved
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className="py-3 px-3">
                            {isRemarksEmpty ? (
                              <span className="font-mono text-neutral-400 font-medium">(-)</span>
                            ) : (
                              <span className="text-neutral-700 text-xs">{emp.remarks}</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${
                                emp.checkInStatus === 'CHECKED_IN'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  emp.checkInStatus === 'CHECKED_IN' ? 'bg-emerald-600' : 'bg-neutral-400'
                                }`}
                              />
                              <span>{emp.checkInStatus === 'CHECKED_IN' ? 'On Field' : 'Offline'}</span>
                            </span>
                            {emp.lastCheckInTime && emp.lastCheckInTime !== '(-)' && (
                              <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                {emp.lastCheckInTime}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEmployeeForEdit(emp);
                                  setIsEditModalOpen(true);
                                }}
                                title="Edit Employee Profile"
                                className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#E5E7EB] hover:border-neutral-400 hover:bg-neutral-50 text-[#111827] transition-all flex items-center gap-1 shadow-2xs"
                              >
                                <Pencil className="w-3 h-3 text-neutral-600" />
                                <span>Edit</span>
                              </button>

                              <a
                                href={`https://wa.me/${emp.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(emp.name)}%2C%20FILTEC%20Operations%20Update.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Send WhatsApp Message"
                                className="p-1.5 rounded-md border border-[#E5E7EB] hover:border-emerald-300 hover:bg-emerald-50 text-neutral-600 hover:text-emerald-700 transition-colors"
                              >
                                <span className="text-[10px] font-mono font-bold text-emerald-700">WA</span>
                              </a>

                              <Link
                                href="/admin/attendance"
                                className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#E5E7EB] hover:border-neutral-400 hover:bg-neutral-50 text-[#111827] transition-all"
                              >
                                Attendance
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'LEAVE' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div>
                <h3 className="text-sm font-bold text-[#111827] uppercase font-mono">
                  Leave & Regularization Administration
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Review, approve or reject leave requests from field sales personnel
                </p>
              </div>
              <span className="text-xs font-mono text-[#6B7280]">
                {pendingLeaves.length} Pending Approval
              </span>
            </div>

            <div className="divide-y divide-[#E5E7EB]">
              {leaveRequests.map((leave) => (
                <div key={leave.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#111827]">{leave.employeeName}</span>
                      <span className="font-mono text-[10px] uppercase font-semibold bg-neutral-100 px-2 py-0.5 rounded text-neutral-800">
                        {leave.leaveType} LEAVE {leave.isHalfDay && '(Half Day)'}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
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

                    <div className="text-[#4B5563] flex items-center gap-3 text-xs">
                      <span>
                        Duration: <strong>{leave.daysCount} Day(s)</strong> ({leave.startDate} to {leave.endDate})
                      </span>
                      {leave.contactNumber && (
                        <span className="font-mono text-[11px] text-[#6B7280]">
                          Emergency: {leave.contactNumber}
                        </span>
                      )}
                    </div>

                    <div className="text-[#374151] bg-[#F9FAFB] p-2.5 rounded-lg border border-[#F3F4F6] text-xs">
                      <span className="font-semibold text-neutral-500 text-[10px] block uppercase font-mono mb-0.5">
                        Reason:
                      </span>
                      "{leave.reason}"
                    </div>

                    {leave.rejectionReason && (
                      <div className="text-rose-800 bg-rose-50/60 p-2 rounded-lg border border-rose-200 text-xs">
                        <span className="font-bold text-rose-600 text-[10px] block uppercase font-mono">
                          Rejection Remark:
                        </span>
                        {leave.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {leave.status === 'PENDING' && (
                      <>
                        {rejectingLeaveId === leave.id ? (
                          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-neutral-50 border border-[#E5E7EB] w-72">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Reason for rejection..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="px-2.5 py-1 text-xs rounded border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingLeaveId(null);
                                  setRejectionReason('');
                                }}
                                className="px-2 py-0.5 text-[11px] text-[#6B7280] hover:text-[#111827]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectLeave(leave.id)}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded shadow-2xs"
                              >
                                Confirm Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingLeaveId(leave.id);
                                setRejectionReason('');
                              }}
                              className="border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Reject</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApproveLeave(leave.id)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>Approve</span>
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {leave.status === 'APPROVED' && (
                      <span className="text-emerald-700 font-mono text-[11px] font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved by Operations
                      </span>
                    )}

                    {leave.status === 'REJECTED' && (
                      <span className="text-rose-700 font-mono text-[11px] font-semibold flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Declined by Operations
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <MobileBottomNav />

      <OnboardEmployeeModal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        onSuccess={() => setIsOnboardModalOpen(false)}
      />

      <EditEmployeeModal
        isOpen={isEditModalOpen}
        employee={selectedEmployeeForEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployeeForEdit(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedEmployeeForEdit(null);
        }}
      />
    </div>
  );
}
