'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  DollarSign,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  MessageSquare,
  Shield,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { useAppStore, store } from '@/data/store';
import { Employee, Role } from '@/types';
import {
  ADMIN_PAGE_OPTIONS,
  EMPLOYEE_PAGE_OPTIONS,
  ALL_ADMIN_PAGES,
  ALL_EMPLOYEE_PAGES
} from '@/data/initialSeed';

const STANDARD_TERRITORIES = [
  '(-)',
  'All Hubs & Branches',
  'Bhubaneswar & Cuttack',
  'Sambalpur & Bargarh',
  'Rourkela & Sundargarh',
  'Berhampur & Ganjam',
  'Balasore & Bhadrak',
  'Ahmedabad North & Gandhinagar',
  'Surat Industrial Belt',
  'Vadodara & Anand Hub',
  'Rajkot & Saurashtra'
];

const DESIGNATIONS = [
  'Operations Admin',
  'Sr. Marketing Executive',
  'Sr. Office Executive',
  'Factory Head',
  'Executive-Multitask',
  'Field Sales Officer',
  'Technical Sales Engineer',
  'Territory Sales Representative',
  'Operations Executive',
  'Area Sales Manager'
];

export function OnboardEmployeeModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (emp: Employee) => void;
}) {
  const { employees, dealers } = useAppStore();

  const [systemRole, setSystemRole] = useState<Role>('EMPLOYEE');

  // Auto-calculate next code
  const nextNum = employees.reduce((max, e) => {
    const match = e.code.match(/(?:EMP-|FPPL\/OD-)(\d+)/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 9) + 1;
  const defaultEmpCode = `FPPL/OD-${String(nextNum).padStart(3, '0')}`;
  const adminCount = employees.filter((e) => e.systemRole === 'ADMIN').length;
  const defaultAdminCode = `FPPL/ADM-${String(adminCount + 1).padStart(3, '0')}`;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    code: defaultEmpCode,
    designation: 'Sr. Marketing Executive',
    territory: '(-)',
    customTerritory: '',
    targetMonthly: 0,
    baseSalary: 0,
    remarks: '(-)',
    selectedDealerIds: [] as string[],
    allowedPages: [...ALL_EMPLOYEE_PAGES]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successEmployee, setSuccessEmployee] = useState<Employee | null>(null);

  if (!isOpen) return null;

  const territoryToUse =
    formData.territory === 'CUSTOM' ? formData.customTerritory || '(-)' : formData.territory || '(-)';

  const grantedAdminPages = ADMIN_PAGE_OPTIONS.filter((p) => formData.allowedPages.includes(p.path));
  const grantedFieldPages = EMPLOYEE_PAGE_OPTIONS.filter((p) => formData.allowedPages.includes(p.path));

  const handleRoleSelect = (role: Role) => {
    setSystemRole(role);
    if (role === 'ADMIN') {
      setFormData({
        ...formData,
        code: defaultAdminCode,
        designation: 'Operations Admin',
        territory: 'All Hubs & Branches',
        allowedPages: Array.from(new Set([...formData.allowedPages, ...ALL_ADMIN_PAGES]))
      });
    } else {
      setFormData({
        ...formData,
        code: defaultEmpCode,
        designation: 'Sr. Marketing Executive',
        territory: '(-)'
      });
    }
  };

  const handleTogglePage = (path: string) => {
    const exists = formData.allowedPages.includes(path);
    const updated = exists
      ? formData.allowedPages.filter((p) => p !== path)
      : [...formData.allowedPages, path];
    setFormData({ ...formData, allowedPages: updated });
  };

  const applyPreset = (preset: 'STANDARD_FIELD' | 'SUPERVISOR' | 'PLANT_HEAD' | 'FULL_ADMIN') => {
    if (preset === 'STANDARD_FIELD') {
      setSystemRole('EMPLOYEE');
      setFormData({
        ...formData,
        code: defaultEmpCode,
        designation: 'Sr. Marketing Executive',
        allowedPages: [...ALL_EMPLOYEE_PAGES]
      });
    } else if (preset === 'SUPERVISOR') {
      setSystemRole('EMPLOYEE');
      setFormData({
        ...formData,
        code: defaultEmpCode,
        designation: 'Field Sales Supervisor',
        allowedPages: Array.from(new Set([...ALL_EMPLOYEE_PAGES, '/admin/orders', '/admin/dealers']))
      });
    } else if (preset === 'PLANT_HEAD') {
      setSystemRole('EMPLOYEE');
      setFormData({
        ...formData,
        code: defaultEmpCode,
        designation: 'Factory Head',
        allowedPages: Array.from(new Set([...ALL_EMPLOYEE_PAGES, '/admin/catalogue', '/admin/attendance']))
      });
    } else if (preset === 'FULL_ADMIN') {
      setSystemRole('ADMIN');
      setFormData({
        ...formData,
        code: defaultAdminCode,
        designation: 'Operations Admin',
        allowedPages: Array.from(new Set([...ALL_ADMIN_PAGES, ...ALL_EMPLOYEE_PAGES]))
      });
    }
  };

  const handleSelectAllAdmin = () => {
    setFormData({
      ...formData,
      allowedPages: Array.from(new Set([...formData.allowedPages, ...ALL_ADMIN_PAGES]))
    });
  };

  const handleClearAdmin = () => {
    setFormData({
      ...formData,
      allowedPages: formData.allowedPages.filter((p) => !p.startsWith('/admin'))
    });
  };

  const handleSelectAllField = () => {
    setFormData({
      ...formData,
      allowedPages: Array.from(new Set([...formData.allowedPages, ...ALL_EMPLOYEE_PAGES]))
    });
  };

  const handleClearField = () => {
    setFormData({
      ...formData,
      allowedPages: formData.allowedPages.filter((p) => !p.startsWith('/employee'))
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const created = store.onboardEmployee({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || '(-)',
        code: formData.code.trim() || (systemRole === 'ADMIN' ? defaultAdminCode : defaultEmpCode),
        designation: formData.designation || (systemRole === 'ADMIN' ? 'Operations Admin' : 'Field Staff'),
        territory: territoryToUse,
        targetMonthly: Number(formData.targetMonthly) || 0,
        baseSalary: Number(formData.baseSalary) || 0,
        remarks: formData.remarks.trim() || '(-)',
        assignedDealerIds: formData.selectedDealerIds,
        systemRole: systemRole,
        allowedPages: formData.allowedPages
      });

      setIsSubmitting(false);
      setSuccessEmployee(created);
      onSuccess(created);
    }, 400);
  };

  const handleClose = () => {
    setSuccessEmployee(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DC2626] text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900">Onboard New Personnel</h3>
              <p className="text-[11px] text-neutral-500">
                Provision Operations Administrators or Field Representatives with tailored access to admin & field pages
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {successEmployee ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-neutral-900">
                {successEmployee.name} Onboarded Successfully!
              </h4>
              <p className="text-xs text-neutral-600 mt-1">
                Assigned system role <strong className="text-neutral-900">{successEmployee.systemRole}</strong> with{' '}
                <strong className="text-neutral-900">{successEmployee.allowedPages?.length || 0} authorized pages</strong>.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 border border-neutral-200 font-mono text-xs text-neutral-800">
                <span>Code: {successEmployee.code}</span>
                <span>•</span>
                <span>Role: {successEmployee.systemRole}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={handleClose}
                className="bg-[#111827] text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-black transition-all"
              >
                Close & View in Directory
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto grow">
            {/* ROLE SELECTOR CARDS */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-900">
                Primary System Role <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ADMIN CARD */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('ADMIN')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    systemRole === 'ADMIN'
                      ? 'border-[#DC2626] bg-red-50/50 shadow-xs'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      systemRole === 'ADMIN'
                        ? 'bg-[#DC2626] text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-neutral-900">Operations Admin</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-semibold">
                        Full Admin
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                      Executive control over operational admin pages, order approvals, catalog stock & settings
                    </p>
                  </div>
                </button>

                {/* EMPLOYEE CARD */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('EMPLOYEE')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    systemRole === 'EMPLOYEE'
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      systemRole === 'EMPLOYEE'
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-neutral-900">Field Employee</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-semibold">
                        Field Ops (+ Custom Admin Pages)
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                      Field sales rep who can also be granted access to designated admin modules below
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* QUICK PRESETS BAR */}
            <div className="flex items-center flex-wrap gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="text-[11px] font-semibold text-neutral-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Presets:
              </span>
              <button
                type="button"
                onClick={() => applyPreset('STANDARD_FIELD')}
                className="text-[11px] font-medium px-2 py-1 rounded bg-white hover:bg-blue-50 hover:text-blue-700 border border-neutral-200 transition-colors"
              >
                Standard Field Rep (5 Field)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('SUPERVISOR')}
                className="text-[11px] font-medium px-2 py-1 rounded bg-white hover:bg-rose-50 hover:text-rose-700 border border-neutral-200 transition-colors"
              >
                Supervisor (+ Admin Orders & Dealers)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('PLANT_HEAD')}
                className="text-[11px] font-medium px-2 py-1 rounded bg-white hover:bg-rose-50 hover:text-rose-700 border border-neutral-200 transition-colors"
              >
                Plant Head (+ Admin Catalogue & Attendance)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('FULL_ADMIN')}
                className="text-[11px] font-medium px-2 py-1 rounded bg-white hover:bg-rose-50 hover:text-rose-700 border border-neutral-200 transition-colors"
              >
                Full Admin (All 15 Pages)
              </button>
            </div>

            {/* ADMIN MODULES SELECTOR */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/20 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-600" />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">
                      Admin Management Modules ({grantedAdminPages.length} of {ADMIN_PAGE_OPTIONS.length} Granted)
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      Grant this employee access to specific administrative pages
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllAdmin}
                    className="text-[11px] text-[#DC2626] font-semibold hover:underline"
                  >
                    Grant All Admin
                  </button>
                  <span className="text-neutral-300">•</span>
                  <button
                    type="button"
                    onClick={handleClearAdmin}
                    className="text-[11px] text-neutral-500 hover:underline"
                  >
                    Clear Admin
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ADMIN_PAGE_OPTIONS.map((page) => {
                  const isChecked = formData.allowedPages.includes(page.path);
                  return (
                    <label
                      key={page.path}
                      className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-rose-300 bg-white shadow-2xs'
                          : 'border-neutral-200 bg-white/70 hover:bg-white opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePage(page.path)}
                        className="mt-0.5 rounded border-neutral-300 text-[#DC2626] focus:ring-[#DC2626] w-3.5 h-3.5"
                      />
                      <div className="grow">
                        <span className="font-semibold text-neutral-900 block">{page.label}</span>
                        <span className="text-[10px] text-neutral-500 font-mono line-clamp-1">
                          {page.path}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* FIELD MODULES SELECTOR */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">
                      Field Sales & Self-Service Modules ({grantedFieldPages.length} of {EMPLOYEE_PAGE_OPTIONS.length} Granted)
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      Standard mobile and field representative access
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllField}
                    className="text-[11px] text-blue-600 font-semibold hover:underline"
                  >
                    Grant All Field
                  </button>
                  <span className="text-neutral-300">•</span>
                  <button
                    type="button"
                    onClick={handleClearField}
                    className="text-[11px] text-neutral-500 hover:underline"
                  >
                    Clear Field
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EMPLOYEE_PAGE_OPTIONS.map((page) => {
                  const isChecked = formData.allowedPages.includes(page.path);
                  return (
                    <label
                      key={page.path}
                      className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-blue-300 bg-white shadow-2xs'
                          : 'border-neutral-200 bg-white/70 hover:bg-white opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePage(page.path)}
                        className="mt-0.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-3.5 h-3.5"
                      />
                      <div className="grow">
                        <span className="font-semibold text-neutral-900 block">{page.label}</span>
                        <span className="text-[10px] text-neutral-500 font-mono line-clamp-1">
                          {page.path}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* BASIC DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Subham Sahu"
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Designation / Role Title <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                >
                  {DESIGNATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Phone / WhatsApp <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 94378 12345"
                    className="w-full text-xs pl-8 p-2.5 rounded-lg border border-neutral-200 font-mono focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Official Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="employee@filtec.in"
                    className="w-full text-xs pl-8 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Employee / Staff Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 font-mono focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Territory / Scope
                </label>
                <select
                  value={formData.territory}
                  onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                >
                  {STANDARD_TERRITORIES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Monthly Target (₹ INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={formData.targetMonthly}
                  onChange={(e) => setFormData({ ...formData, targetMonthly: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 font-mono focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Base Salary (₹ INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 font-mono focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Onboarding...' : 'Confirm & Onboard'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
