'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Pencil,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  MessageSquare,
  Building2,
  ShieldCheck,
  Shield,
  UserCheck,
  CheckSquare,
  Square,
  AlertCircle,
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

export function EditEmployeeModal({
  employee,
  isOpen,
  onClose,
  onSuccess
}: {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: Employee) => void;
}) {
  const { dealers } = useAppStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    designation: '',
    customDesignation: '',
    territory: '',
    customTerritory: '',
    targetMonthly: 0,
    baseSalary: 0,
    remarks: '',
    checkInStatus: 'CHECKED_OUT' as 'CHECKED_IN' | 'CHECKED_OUT',
    systemRole: 'EMPLOYEE' as Role,
    allowedPages: [] as string[],
    assignedDealerIds: [] as string[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (employee) {
      const isCustomTerritory =
        employee.territory && !STANDARD_TERRITORIES.includes(employee.territory);
      const isCustomDesignation =
        employee.designation && !DESIGNATIONS.includes(employee.designation);

      const isSamir = (employee.name || '').toLowerCase() === 'samir' || employee.code === 'FPPL/ADM-001';
      const role: Role = employee.systemRole || (isSamir ? 'ADMIN' : 'EMPLOYEE');
      const pages =
        employee.allowedPages && employee.allowedPages.length > 0
          ? employee.allowedPages
          : role === 'ADMIN'
          ? ALL_ADMIN_PAGES
          : ALL_EMPLOYEE_PAGES;

      const rawPhone = isSamir ? '+91 9437505814' : (employee.phone || '');
      const clean = rawPhone.replace(/^\+91[\s-]*/, '').replace(/^91(?=\d{10})/, '').replace(/\s+/g, '').trim();
      const formattedPhone = isSamir
        ? '+91 9437505814'
        : (clean && clean !== '-' && clean !== '(-)' ? `+91 ${clean}` : rawPhone);

      setFormData({
        name: employee.name || '',
        phone: formattedPhone,
        email: employee.email && employee.email !== '(-)' ? employee.email : '',
        designation: isCustomDesignation
          ? 'CUSTOM'
          : employee.designation || (role === 'ADMIN' ? 'Operations Admin' : 'Sr. Marketing Executive'),
        customDesignation: isCustomDesignation ? employee.designation || '' : '',
        territory: isCustomTerritory
          ? 'CUSTOM'
          : employee.territory || (role === 'ADMIN' ? 'All Hubs & Branches' : '(-)'),
        customTerritory: isCustomTerritory ? employee.territory || '' : '',
        targetMonthly: employee.targetMonthly || 0,
        baseSalary: employee.baseSalary || 0,
        remarks: employee.remarks && employee.remarks !== '(-)' ? employee.remarks : '',
        checkInStatus: employee.checkInStatus || 'CHECKED_OUT',
        systemRole: role,
        allowedPages: pages,
        assignedDealerIds: employee.assignedDealerIds || []
      });
      setSuccessMessage('');
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const resolvedTerritory =
    formData.territory === 'CUSTOM'
      ? formData.customTerritory || '(-)'
      : formData.territory || '(-)';

  const resolvedDesignation =
    formData.designation === 'CUSTOM'
      ? formData.customDesignation || (formData.systemRole === 'ADMIN' ? 'Operations Admin' : 'Field Staff')
      : formData.designation || (formData.systemRole === 'ADMIN' ? 'Operations Admin' : 'Sr. Marketing Executive');

  const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
  const waTargetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const grantedAdminPages = ADMIN_PAGE_OPTIONS.filter((p) => formData.allowedPages.includes(p.path));
  const grantedFieldPages = EMPLOYEE_PAGE_OPTIONS.filter((p) => formData.allowedPages.includes(p.path));

  const handleRoleChange = (newRole: Role) => {
    setFormData({
      ...formData,
      systemRole: newRole,
      designation: newRole === 'ADMIN' ? 'Operations Admin' : formData.designation || 'Sr. Marketing Executive',
      // If switching to admin and has no admin pages, grant full admin
      allowedPages:
        newRole === 'ADMIN' && grantedAdminPages.length === 0
          ? Array.from(new Set([...formData.allowedPages, ...ALL_ADMIN_PAGES]))
          : formData.allowedPages
    });
  };

  const handleTogglePage = (path: string) => {
    const exists = formData.allowedPages.includes(path);
    const newPages = exists
      ? formData.allowedPages.filter((p) => p !== path)
      : [...formData.allowedPages, path];
    setFormData({
      ...formData,
      allowedPages: newPages
    });
  };

  // Presets
  const applyPreset = (preset: 'STANDARD_FIELD' | 'SUPERVISOR' | 'PLANT_HEAD' | 'FULL_ADMIN') => {
    if (preset === 'STANDARD_FIELD') {
      setFormData({
        ...formData,
        systemRole: 'EMPLOYEE',
        allowedPages: ALL_EMPLOYEE_PAGES
      });
    } else if (preset === 'SUPERVISOR') {
      setFormData({
        ...formData,
        systemRole: 'EMPLOYEE',
        allowedPages: Array.from(new Set([...ALL_EMPLOYEE_PAGES, '/admin/orders', '/admin/dealers']))
      });
    } else if (preset === 'PLANT_HEAD') {
      setFormData({
        ...formData,
        systemRole: 'EMPLOYEE',
        allowedPages: Array.from(
          new Set([...ALL_EMPLOYEE_PAGES, '/admin/catalogue', '/admin/attendance'])
        )
      });
    } else if (preset === 'FULL_ADMIN') {
      setFormData({
        ...formData,
        systemRole: 'ADMIN',
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
      const isSamir = (employee.name || '').toLowerCase() === 'samir' || employee.code === 'FPPL/ADM-001';
      const cleanVal = formData.phone.trim().replace(/^\+91[\s-]*/, '').replace(/^91(?=\d{10})/, '').replace(/\s+/g, '').trim();
      const finalPhone = isSamir
        ? '+91 9437505814'
        : (cleanVal && cleanVal !== '-' ? `+91 ${cleanVal}` : formData.phone.trim());

      const updated = store.updateEmployee(employee.id, {
        name: formData.name.trim(),
        phone: finalPhone,
        email: formData.email.trim() ? formData.email.trim() : '(-)',
        designation: resolvedDesignation,
        territory: resolvedTerritory,
        targetMonthly: Number(formData.targetMonthly) || 0,
        baseSalary: Number(formData.baseSalary) || 0,
        remarks: formData.remarks.trim() ? formData.remarks.trim() : '(-)',
        checkInStatus: formData.checkInStatus,
        systemRole: formData.systemRole,
        allowedPages: formData.allowedPages,
        assignedDealerIds: formData.assignedDealerIds
      });

      setIsSubmitting(false);
      setSuccessMessage(
        `Permissions updated for ${formData.name}: ${grantedAdminPages.length} Admin Modules & ${grantedFieldPages.length} Field Pages granted.`
      );

      setTimeout(() => {
        if (updated && onSuccess) {
          onSuccess(updated);
        }
        onClose();
      }, 700);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-3xl my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Pencil className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#111827]">Edit Staff & Access Control</h3>
                <span className="tech-code font-bold text-xs bg-[#111827] text-white px-2 py-0.5 rounded font-mono">
                  {employee.code}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                    formData.systemRole === 'ADMIN'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {formData.systemRole}
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Assign administrative privileges, designate authorized admin & field pages, and configure contact terms
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

        {/* Success alert banner */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto grow">
          {/* SECTION 1: SYSTEM ROLE & PRIVILEGES */}
          <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-[#111827]">
                  Primary System Role
                </label>
                <p className="text-[11px] text-[#6B7280]">
                  Employees can be granted access to specific admin pages even with Field Employee role
                </p>
              </div>
              <span className="text-[11px] font-mono font-medium text-neutral-500">
                Active Role: <strong className="text-neutral-900">{formData.systemRole}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* ADMIN Option */}
              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  formData.systemRole === 'ADMIN'
                    ? 'border-[#DC2626] bg-red-50/40 shadow-2xs'
                    : 'border-[#E5E7EB] bg-white hover:bg-neutral-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    formData.systemRole === 'ADMIN'
                      ? 'bg-[#DC2626] text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#111827]">Operations Admin</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-semibold">
                      Full Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                    Full executive control over all operational admin pages, order approvals & system settings
                  </p>
                </div>
              </button>

              {/* EMPLOYEE Option */}
              <button
                type="button"
                onClick={() => handleRoleChange('EMPLOYEE')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  formData.systemRole === 'EMPLOYEE'
                    ? 'border-blue-600 bg-blue-50/40 shadow-2xs'
                    : 'border-[#E5E7EB] bg-white hover:bg-neutral-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    formData.systemRole === 'EMPLOYEE'
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#111827]">Field Employee</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-semibold">
                      Field Ops (+ Custom Admin Pages)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                    Field representative who can also be granted access to designated admin modules below
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* QUICK PERMISSION PRESETS BAR */}
          <div className="flex items-center flex-wrap gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <span className="text-[11px] font-semibold text-neutral-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Access Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('STANDARD_FIELD')}
              className="text-[11px] font-medium px-2 py-1 rounded bg-white hover:bg-blue-50 hover:text-blue-700 border border-neutral-200 transition-colors"
            >
              Standard Field Rep (5 Field Pages)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('SUPERVISOR')}
              className="text-[11px] font-medium px-2 py-1 rounded bg-white hover:bg-rose-50 hover:text-rose-700 border border-neutral-200 transition-colors"
            >
              Sales Supervisor (+ Admin Orders & Dealers)
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

          {/* SECTION 2A: ADMIN MANAGEMENT MODULES (10 Pages) */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-600" />
                <div>
                  <label className="block text-xs font-bold text-[#111827]">
                    Admin Management Modules ({grantedAdminPages.length} of {ADMIN_PAGE_OPTIONS.length} Granted)
                  </label>
                  <p className="text-[11px] text-[#6B7280]">
                    Select which administrative pages and operations modules this employee is permitted to access
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllAdmin}
                  className="text-[11px] text-[#DC2626] hover:underline font-semibold"
                >
                  Grant All Admin
                </button>
                <span className="text-neutral-300">•</span>
                <button
                  type="button"
                  onClick={handleClearAdmin}
                  className="text-[11px] text-[#6B7280] hover:underline"
                >
                  Clear Admin
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {ADMIN_PAGE_OPTIONS.map((page) => {
                const isChecked = formData.allowedPages.includes(page.path);
                return (
                  <label
                    key={page.path}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-rose-300 bg-white shadow-2xs'
                        : 'border-neutral-200 bg-white/70 hover:bg-white opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePage(page.path)}
                      className="mt-0.5 rounded border-neutral-300 text-[#DC2626] focus:ring-[#DC2626] w-4 h-4 cursor-pointer"
                    />
                    <div className="grow">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111827]">{page.label}</span>
                        <span className="text-[9px] font-mono text-rose-700 bg-rose-50 border border-rose-200 uppercase px-1 rounded font-semibold">
                          {page.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6B7280] line-clamp-1 mt-0.5 font-mono">
                        {page.path} • {page.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SECTION 2B: FIELD SALES & SELF-SERVICE MODULES (5 Pages) */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <div>
                  <label className="block text-xs font-bold text-[#111827]">
                    Field Sales & Self-Service Modules ({grantedFieldPages.length} of {EMPLOYEE_PAGE_OPTIONS.length} Granted)
                  </label>
                  <p className="text-[11px] text-[#6B7280]">
                    Field representative views: Today dashboard, dealer network, orders booking, and GPS punch
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllField}
                  className="text-[11px] text-blue-600 hover:underline font-semibold"
                >
                  Grant All Field
                </button>
                <span className="text-neutral-300">•</span>
                <button
                  type="button"
                  onClick={handleClearField}
                  className="text-[11px] text-[#6B7280] hover:underline"
                >
                  Clear Field
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {EMPLOYEE_PAGE_OPTIONS.map((page) => {
                const isChecked = formData.allowedPages.includes(page.path);
                return (
                  <label
                    key={page.path}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-blue-300 bg-white shadow-2xs'
                        : 'border-neutral-200 bg-white/70 hover:bg-white opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePage(page.path)}
                      className="mt-0.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <div className="grow">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111827]">{page.label}</span>
                        <span className="text-[9px] font-mono text-blue-700 bg-blue-50 border border-blue-200 uppercase px-1 rounded font-semibold">
                          {page.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6B7280] line-clamp-1 mt-0.5 font-mono">
                        {page.path} • {page.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: STAFF GENERAL PROFILE & CONTACT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                placeholder="e.g. Subham Sahu"
              />
            </div>

            {/* Position / Designation */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Position / Title <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              >
                {DESIGNATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="CUSTOM">+ Custom Designation</option>
              </select>
              {formData.designation === 'CUSTOM' && (
                <input
                  type="text"
                  required
                  placeholder="Enter custom designation"
                  value={formData.customDesignation}
                  onChange={(e) => setFormData({ ...formData, customDesignation: e.target.value })}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              )}
            </div>

            {/* Phone & WhatsApp Contact */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#374151]">
                  Phone & WhatsApp Number <span className="text-rose-600">*</span>
                </label>
                {cleanPhone.length >= 10 && (
                  <a
                    href={`https://wa.me/${waTargetPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 font-mono font-medium"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Test WA Link
                  </a>
                )}
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 94378 12345"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] font-mono"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Official Email (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="employee@filtec.in"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            {/* Territory / Region */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Assigned Territory / Scope
              </label>
              <select
                value={formData.territory}
                onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              >
                {STANDARD_TERRITORIES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="CUSTOM">+ Custom Territory</option>
              </select>
              {formData.territory === 'CUSTOM' && (
                <input
                  type="text"
                  required
                  placeholder="Enter custom territory"
                  value={formData.customTerritory}
                  onChange={(e) => setFormData({ ...formData, customTerritory: e.target.value })}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Status
              </label>
              <select
                value={formData.checkInStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    checkInStatus: e.target.value as 'CHECKED_IN' | 'CHECKED_OUT'
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              >
                <option value="CHECKED_OUT">Offline / Checked Out</option>
              </select>
            </div>
          </div>

          {/* COMPENSATION & SALARY SETTINGS */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  ₹
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111827]">
                    Compensation & Remuneration
                  </label>
                  <p className="text-[11px] text-[#6B7280]">
                    Monthly base salary used for attendance-linked payroll & official payslips
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Monthly Base Salary (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.baseSalary || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, baseSalary: Number(e.target.value) || 0 })
                    }
                    placeholder="e.g. 25000"
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Base rate pro-rated on Mon–Sat verified attendance days
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Monthly Sales Target (₹) <span className="text-[10px] text-neutral-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.targetMonthly || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, targetMonthly: Number(e.target.value) || 0 })
                    }
                    placeholder="e.g. 500000"
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Monthly secondary sales order booking target
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: ASSIGNED DEALER PORTFOLIO */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-[#F9FAFB] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-neutral-600" />
                <div>
                  <label className="block text-xs font-bold text-[#111827]">
                    Assigned Dealer Portfolio ({formData.assignedDealerIds.length} of {dealers.length} Assigned)
                  </label>
                  <p className="text-[11px] text-[#6B7280]">
                    Assign commercial dealer accounts to this field representative for territory coverage
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      assignedDealerIds: dealers.map((d) => d.id)
                    });
                  }}
                  className="text-[11px] text-[#DC2626] hover:underline font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-neutral-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      assignedDealerIds: []
                    });
                  }}
                  className="text-[11px] text-[#6B7280] hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {dealers.map((dealer) => {
                const isAssigned = formData.assignedDealerIds.includes(dealer.id);
                return (
                  <label
                    key={dealer.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isAssigned
                        ? 'border-[#111827] bg-white shadow-2xs font-semibold'
                        : 'border-neutral-200 bg-white/60 hover:bg-white text-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => {
                          const newIds = isAssigned
                            ? formData.assignedDealerIds.filter((id) => id !== dealer.id)
                            : [...formData.assignedDealerIds, dealer.id];
                          setFormData({ ...formData, assignedDealerIds: newIds });
                        }}
                        className="rounded border-neutral-300 text-[#DC2626] focus:ring-[#DC2626] w-4 h-4 cursor-pointer"
                      />
                      <span className="font-mono text-[10px] bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200">
                        {dealer.code}
                      </span>
                      <span className="text-[#111827]">{dealer.name}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {dealer.city}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">
              Operational Remarks & Access Notes
            </label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Field executive with special access to stock & order approvals"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
            />
          </div>

          {/* Audit note */}
          <div className="bg-neutral-50 p-3 rounded-lg border border-[#E5E7EB] flex items-center gap-2 text-[11px] text-[#6B7280]">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Configured admin modules and field access take effect immediately. The employee will see authorized admin pages directly in their portal.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#4B5563] hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
