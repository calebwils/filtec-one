'use client';

import React, { useState } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore, store } from '@/data/store';
import {
  Settings,
  Shield,
  Building2,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Save,
  RotateCcw,
  Sliders,
  Users,
  Lock,
  Smartphone,
  CreditCard,
  Radio,
  FileCheck,
  UserCheck,
  Pencil,
  CheckSquare
} from 'lucide-react';
import { AppSettings, Employee, Role } from '@/types';
import { EditEmployeeModal } from '@/components/admin/EditEmployeeModal';
import {
  ADMIN_PAGE_OPTIONS,
  EMPLOYEE_PAGE_OPTIONS,
  ALL_ADMIN_PAGES,
  ALL_EMPLOYEE_PAGES,
  ALL_DEALER_PAGES
} from '@/data/initialSeed';

export default function AdminSettingsPage() {
  const { settings, employees } = useAppStore();

  const [activeTab, setActiveTab] = useState<
    'ROLES_PERMISSIONS' | 'COMPANY_PROFILE' | 'LEAVE_POLICY' | 'AUTOMATIONS'
  >('ROLES_PERMISSIONS');

  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    store.updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const handleReset = () => {
    if (confirm('Reset settings to factory operational defaults?')) {
      setFormData(settings);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Settings" subtitle="Access Governance & Operational Parameters" />
      <DesktopSubNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Header Title & Save Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Operations & System Settings</h2>
            <p className="text-xs text-[#6B7280]">
              Role permissions, enterprise company details, HR leave quotas, and automated WhatsApp triggers
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSaved && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg animate-in fade-in duration-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Settings Saved!
              </span>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-neutral-100 text-xs text-[#4B5563] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-[#E5E7EB] pb-2 overflow-x-auto text-xs">
          {[
            {
              id: 'ROLES_PERMISSIONS',
              label: 'Roles & Permissions',
              icon: Shield
            },
            {
              id: 'COMPANY_PROFILE',
              label: 'Company & Operations',
              icon: Building2
            },
            {
              id: 'LEAVE_POLICY',
              label: 'Leave & Attendance Policy',
              icon: Calendar
            },
            {
              id: 'AUTOMATIONS',
              label: 'WhatsApp & ERP Automations',
              icon: MessageSquare
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-neutral-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ROLES & PERMISSIONS */}
        {activeTab === 'ROLES_PERMISSIONS' && (
          <div className="space-y-5">
            {/* SECTION 1: STAFF ROLE & PAGE ACCESS ASSIGNMENT */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-[#F3F4F6] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#DC2626]" />
                    <span>Staff Role & Admin Privilege Assignment</span>
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Define who is an Operations Admin vs Field Employee, and assign specific page management rights
                  </p>
                </div>
                <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200 self-start sm:self-auto">
                  {employees.filter((e) => e.systemRole === 'ADMIN').length} Admins •{' '}
                  {employees.filter((e) => e.systemRole !== 'ADMIN').length} Field Reps
                </span>
              </div>

              {/* Staff Table with Role Dropdown & Page Access */}
              <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] uppercase font-mono text-[10px]">
                      <th className="py-2.5 px-3">Staff Code</th>
                      <th className="py-2.5 px-4">Name & Title</th>
                      <th className="py-2.5 px-3">System Role</th>
                      <th className="py-2.5 px-3">Authorized Pages</th>
                      <th className="py-2.5 px-3">Territory</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {employees.map((emp) => {
                      const isAdmin = emp.systemRole === 'ADMIN';
                      const allowedCount =
                        emp.allowedPages && emp.allowedPages.length > 0
                          ? emp.allowedPages.length
                          : isAdmin
                          ? 10
                          : 5;

                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-neutral-50/70 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <span className="tech-code font-bold text-xs bg-[#111827] text-white px-2 py-0.5 rounded font-mono">
                              {emp.code}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                              <span>{emp.name}</span>
                              {emp.name.toLowerCase() === 'samir' && (
                                <span className="bg-rose-100 text-rose-700 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#6B7280]">
                              {emp.designation || '(-)'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={emp.systemRole || (isAdmin ? 'ADMIN' : 'EMPLOYEE')}
                              onChange={(e) => {
                                const newRole = e.target.value as Role;
                                store.assignEmployeeRole(emp.id, newRole);
                                setIsSaved(true);
                                setTimeout(() => setIsSaved(false), 2000);
                              }}
                              className={`text-xs font-semibold px-2 py-1 rounded-md border cursor-pointer ${
                                isAdmin
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              <option value="ADMIN">ADMIN (Full Operations)</option>
                              <option value="EMPLOYEE">EMPLOYEE (Field Rep)</option>
                            </select>
                          </td>
                          <td className="py-3 px-3">
                            {(() => {
                              const adminPagesCount = (emp.allowedPages || []).filter((p) =>
                                p.startsWith('/admin')
                              ).length;
                              const fieldPagesCount = (emp.allowedPages || []).filter((p) =>
                                p.startsWith('/employee')
                              ).length;

                              if (emp.systemRole === 'ADMIN') {
                                return (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                                      <Shield className="w-2.5 h-2.5 text-rose-600" />
                                      <span>{adminPagesCount || 10} Admin Pages</span>
                                    </span>
                                    {fieldPagesCount > 0 && (
                                      <div className="text-[10px] text-neutral-500 font-mono">
                                        +{fieldPagesCount} Field Pages
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                    <UserCheck className="w-2.5 h-2.5 text-blue-600" />
                                    <span>{fieldPagesCount || 5} Field</span>
                                  </span>
                                  {adminPagesCount > 0 && (
                                    <div className="text-[10px] text-rose-700 font-mono font-semibold flex items-center gap-0.5">
                                      <Shield className="w-2.5 h-2.5 text-rose-600" />
                                      <span>+{adminPagesCount} Admin Modules</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-3 text-neutral-600 text-[11px]">
                            {emp.territory || '(-)'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEmployeeForEdit(emp);
                                setIsEditModalOpen(true);
                              }}
                              className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#E5E7EB] hover:bg-neutral-100 text-[#111827] inline-flex items-center gap-1 transition-all shadow-2xs"
                            >
                              <Pencil className="w-3 h-3 text-neutral-500" />
                              <span>Customize Pages</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: DEFAULT PAGE VISIBILITY BY ROLE */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-[#F3F4F6]">
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#DC2626]" />
                  <span>Default Page Visibility by Role Tier</span>
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Configure standard page availability presets for newly onboarded staff and user accounts
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Admin Role Pages */}
                <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-4 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <div>
                      <span className="text-xs font-bold text-[#111827] block">ADMIN PAGES</span>
                      <span className="text-[10px] text-[#6B7280]">Executive Operations Control</span>
                    </div>
                    <span className="bg-rose-50 text-rose-700 text-[10px] font-mono px-2 py-0.5 rounded border border-rose-200 font-semibold">
                      10 Modules
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto pr-1">
                    {ADMIN_PAGE_OPTIONS.map((page) => (
                      <div
                        key={page.path}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E7EB]"
                      >
                        <div>
                          <span className="text-xs font-semibold text-[#111827] block">
                            {page.label}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {page.path}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Employee Role Pages */}
                <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-4 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <div>
                      <span className="text-xs font-bold text-[#111827] block">EMPLOYEE PAGES</span>
                      <span className="text-[10px] text-[#6B7280]">Field Representative Portal</span>
                    </div>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-200 font-semibold">
                      5 Modules
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto pr-1">
                    {EMPLOYEE_PAGE_OPTIONS.map((page) => (
                      <div
                        key={page.path}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E7EB]"
                      >
                        <div>
                          <span className="text-xs font-semibold text-[#111827] block">
                            {page.label}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {page.path}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: OPERATIONAL CAPABILITY MATRIX */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
              <div className="pb-3 border-b border-[#F3F4F6] mb-4">
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#DC2626]" />
                  <span>Operational Action Permissions</span>
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Specific functional privileges across Admin, Employee, and Dealer tiers
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Admin Role Column */}
                <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <div>
                      <span className="text-xs font-bold text-[#111827] block">ADMIN</span>
                      <span className="text-[10px] text-[#6B7280]">Operations & Leadership</span>
                    </div>
                    <span className="bg-rose-50 text-rose-700 text-[10px] font-mono px-2 py-0.5 rounded border border-rose-200 font-semibold">
                      Full Control
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {[
                      { key: 'canApproveOrders', label: 'Approve & Reject Field Orders' },
                      { key: 'canOverridePricing', label: 'Override Catalogue Pricing & Stock' },
                      { key: 'canManageStaff', label: 'Onboard & Edit Staff Profiles' },
                      { key: 'canManageDealers', label: 'Manage Dealers & Credit Limits' },
                      { key: 'canApproveLeave', label: 'Approve & Reject Staff Leaves' },
                      { key: 'canAccessIntegrations', label: 'Access ERP & WhatsApp Logs' }
                    ].map((item) => {
                      const checked =
                        formData.permissions.admin[
                          item.key as keyof typeof formData.permissions.admin
                        ];
                      return (
                        <label
                          key={item.key}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E7EB] hover:bg-neutral-50 cursor-pointer"
                        >
                          <span className="text-[#374151] pr-2 font-medium text-[11px]">
                            {item.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  admin: {
                                    ...formData.permissions.admin,
                                    [item.key]: e.target.checked
                                  }
                                }
                              })
                            }
                            className="rounded border-neutral-300 text-[#DC2626] focus:ring-[#DC2626] w-4 h-4 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Employee Role Column */}
                <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <div>
                      <span className="text-xs font-bold text-[#111827] block">EMPLOYEE</span>
                      <span className="text-[10px] text-[#6B7280]">Field Sales Executives</span>
                    </div>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-200 font-semibold">
                      Field Ops
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {[
                      { key: 'canCreateOrders', label: 'Book Field Orders on Credit' },
                      { key: 'canViewDealers', label: 'View Assigned Dealer Ledger' },
                      { key: 'canEditDealerContact', label: 'Edit Dealer Phone & Contacts' },
                      { key: 'canApplyLeave', label: 'Apply for Leave & Regularization' },
                      { key: 'canViewAttendanceHistory', label: 'View GPS Punch & Selfie History' }
                    ].map((item) => {
                      const checked =
                        formData.permissions.employee[
                          item.key as keyof typeof formData.permissions.employee
                        ];
                      return (
                        <label
                          key={item.key}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E7EB] hover:bg-neutral-50 cursor-pointer"
                        >
                          <span className="text-[#374151] pr-2 font-medium text-[11px]">
                            {item.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  employee: {
                                    ...formData.permissions.employee,
                                    [item.key]: e.target.checked
                                  }
                                }
                              })
                            }
                            className="rounded border-neutral-300 text-[#DC2626] focus:ring-[#DC2626] w-4 h-4 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Dealer Role Column */}
                <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <div>
                      <span className="text-xs font-bold text-[#111827] block">DEALER</span>
                      <span className="text-[10px] text-[#6B7280]">Authorized Distributors</span>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      B2B Partner
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {[
                      { key: 'canCreateDirectOrders', label: 'Book Direct Wholesale Orders' },
                      { key: 'canAllocatePlumberRewards', label: 'Allocate Plumber Reward Points' },
                      { key: 'canViewInvoices', label: 'Download Commercial Invoices' },
                      { key: 'canManagePlumbers', label: 'Add & Manage Linked Plumbers' }
                    ].map((item) => {
                      const checked =
                        formData.permissions.dealer[
                          item.key as keyof typeof formData.permissions.dealer
                        ];
                      return (
                        <label
                          key={item.key}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E7EB] hover:bg-neutral-50 cursor-pointer"
                        >
                          <span className="text-[#374151] pr-2 font-medium text-[11px]">
                            {item.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permissions: {
                                  ...formData.permissions,
                                  dealer: {
                                    ...formData.permissions.dealer,
                                    [item.key]: e.target.checked
                                  }
                                }
                              })
                            }
                            className="rounded border-neutral-300 text-[#DC2626] focus:ring-[#DC2626] w-4 h-4 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPANY & OPERATIONS PROFILE */}
        {activeTab === 'COMPANY_PROFILE' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#DC2626]" />
                <span>Enterprise & Operational Entity Profile</span>
              </h3>
              <p className="text-xs text-[#6B7280]">
                Official manufacturing company identity, manufacturing hub address, and contact lines
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Legal Enterprise Name
                </label>
                <input
                  type="text"
                  value={formData.company.legalName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, legalName: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Platform / Brand Name
                </label>
                <input
                  type="text"
                  value={formData.company.brandName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, brandName: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Plant & Distribution Depot Address
                </label>
                <textarea
                  rows={2}
                  value={formData.company.plantAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, plantAddress: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Official Operations WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={formData.company.supportWhatsApp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, supportWhatsApp: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Official Operations Email
                </label>
                <input
                  type="email"
                  value={formData.company.supportEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, supportEmail: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  GSTIN / Tax ID
                </label>
                <input
                  type="text"
                  value={formData.company.gstin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, gstin: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Standard GST Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.company.defaultGstPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: {
                        ...formData.company,
                        defaultGstPercent: Number(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LEAVE & ATTENDANCE POLICY */}
        {activeTab === 'LEAVE_POLICY' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#DC2626]" />
                <span>Field Attendance & Leave Governance Rules</span>
              </h3>
              <p className="text-xs text-[#6B7280]">
                Define monthly staff quotas, working hours, and GPS verification policies
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Monthly Casual Leave Quota (Days / Month)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.policy.monthlyCasualLeaveQuota}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      policy: {
                        ...formData.policy,
                        monthlyCasualLeaveQuota: Number(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] font-mono"
                />
                <span className="text-[10px] text-[#6B7280] mt-0.5 block">
                  Available monthly for personal errands & family matters
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Annual Planned Leave Quota (Days / Year)
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={formData.policy.annualLeaveQuota}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      policy: {
                        ...formData.policy,
                        annualLeaveQuota: Number(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] font-mono"
                />
                <span className="text-[10px] text-[#6B7280] mt-0.5 block">
                  Subject to 3-day advance notice & distributor visit coverage
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Daily Standard Working Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  max="14"
                  value={formData.policy.workDayHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      policy: { ...formData.policy, workDayHours: Number(e.target.value) }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Morning Check-In Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.policy.checkInGraceMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      policy: {
                        ...formData.policy,
                        checkInGraceMinutes: Number(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] font-mono"
                />
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-[#F3F4F6]">
                <label className="flex items-center justify-between p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-[#111827] block">
                      Enforce Live Camera Photo Selfie on GPS Punch
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                      Requires field officers to snap a verification selfie during check-in and check-out
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.policy.requirePhotoSelfie}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        policy: {
                          ...formData.policy,
                          requirePhotoSelfie: e.target.checked
                        }
                      })
                    }
                    className="rounded border-neutral-300 text-[#DC2626] focus:ring-[#DC2626] w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Dealer Credit Warning Threshold (% of Limit)
                </label>
                <input
                  type="number"
                  min="50"
                  max="95"
                  value={formData.policy.creditLimitWarningPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      policy: {
                        ...formData.policy,
                        creditLimitWarningPercent: Number(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] font-mono"
                />
                <span className="text-[10px] text-[#6B7280] mt-0.5 block">
                  Accounts exceeding this percentage are flagged as Credit Risk on admin roster
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WHATSAPP & AUTOMATIONS */}
        {activeTab === 'AUTOMATIONS' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#DC2626]" />
                <span>Automated Messaging & ERP Integrations</span>
              </h3>
              <p className="text-xs text-[#6B7280]">
                Control automatic dispatches via WhatsApp Cloud API and simulated ERP webhooks
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'whatsappOrderUpdates',
                  title: 'Order Status WhatsApp Alerts',
                  desc: 'Automatically send order confirmation and invoice PDFs to dealer upon Admin approval'
                },
                {
                  key: 'whatsappLeaveUpdates',
                  title: 'Staff Leave Decision WhatsApp Notifications',
                  desc: 'Notify employee instantly via WhatsApp when Operations approves or rejects their leave'
                },
                {
                  key: 'whatsappPaymentReceipts',
                  title: 'Payment & Ledger Credit Alerts',
                  desc: 'Broadcast payment acknowledgment messages to authorized dealer phones'
                },
                {
                  key: 'erpSyncAutomated',
                  title: 'Automated Real-Time ERP Synchronization',
                  desc: 'Synchronize order line items, dealer balance revisions, and employee records with billing ERP'
                }
              ].map((auto) => {
                const checked =
                  formData.notifications[auto.key as keyof typeof formData.notifications];
                return (
                  <label
                    key={auto.key}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <div className="pr-4">
                      <span className="text-xs font-semibold text-[#111827] block">
                        {auto.title}
                      </span>
                      <span className="text-[11px] text-[#6B7280]">{auto.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            [auto.key]: e.target.checked
                          }
                        })
                      }
                      className="rounded border-neutral-300 text-[#DC2626] focus:ring-[#DC2626] w-4 h-4 cursor-pointer shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Edit Staff & Permissions Modal */}
      <EditEmployeeModal
        employee={selectedEmployeeForEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployeeForEdit(null);
        }}
        onSuccess={() => {
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 3000);
        }}
      />

      <MobileBottomNav />
    </div>
  );
}
