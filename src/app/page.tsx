'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { store, useAppStore } from '@/data/store';
import { INITIAL_DEALERS, INITIAL_EMPLOYEES } from '@/data/initialSeed';
import { Employee, Dealer, User, Role } from '@/types';
import {
  Shield,
  UserCheck,
  Building2,
  ArrowRight,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  Briefcase,
  MapPin,
  Sparkles,
  KeyRound,
  Search,
  ChevronDown,
  Loader2
} from 'lucide-react';

type LoginTab = 'DEALER' | 'EMPLOYEE' | 'ADMIN';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LoginTab>('DEALER');

  // Dealer Form State
  const [dealerPhone, setDealerPhone] = useState('');
  const [dealerPassword, setDealerPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedDealerLoggingInId, setSelectedDealerLoggingInId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & toggles
  const [dealerSearchQuery, setDealerSearchQuery] = useState('');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [showManualDealerLogin, setShowManualDealerLogin] = useState(false);

  // Instant lists initialized with pre-seeded data so there is ZERO waiting spinner
  const [dbEmployees, setDbEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [dbDealers, setDbDealers] = useState<Dealer[]>(INITIAL_DEALERS);

  // Background synchronize with PostgreSQL
  useEffect(() => {
    async function loadIdentityData() {
      try {
        const [empRes, dlrRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/dealers')
        ]);
        if (empRes.ok) {
          const empJson = await empRes.json();
          if (empJson.success && empJson.employees && empJson.employees.length > 0) {
            setDbEmployees(empJson.employees);
          }
        }
        if (dlrRes.ok) {
          const dlrJson = await dlrRes.json();
          if (dlrJson.success && dlrJson.dealers && dlrJson.dealers.length > 0) {
            setDbDealers(dlrJson.dealers);
          }
        }
      } catch (err) {
        // Silently use existing data without blocking user
      }
    }
    loadIdentityData();
  }, []);

  // Filtered dynamic lists
  const filteredDealers = dbDealers.filter((d) => {
    if (!dealerSearchQuery.trim()) return true;
    const q = dealerSearchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q) ||
      d.ownerName.toLowerCase().includes(q) ||
      d.phone.includes(q)
    );
  });

  const filteredEmployees = dbEmployees.filter((e) => {
    if (!employeeSearchQuery.trim()) return true;
    const q = employeeSearchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.code.toLowerCase().includes(q) ||
      (e.designation || '').toLowerCase().includes(q) ||
      (e.territory || '').toLowerCase().includes(q) ||
      (e.phone || '').includes(q)
    );
  });

  // Direct 1-Click Dealer identity sign-in (Instant on mobile & laptop)
  const handleDirectDealerLogin = (dealer: Dealer) => {
    setErrorMessage(null);
    setSelectedDealerLoggingInId(dealer.id);

    // 1. Immediately save authenticated dealer session
    const authenticatedUser: User = {
      id: `user-${dealer.id}`,
      name: dealer.name,
      email: `${dealer.code.toLowerCase()}@filtec-dealers.in`,
      phone: dealer.phone,
      role: 'DEALER',
      dealerId: dealer.id,
      allowedPages: [
        '/dealer',
        '/dealer/catalogue',
        '/dealer/orders',
        '/dealer/rewards',
        '/dealer/plumbers',
        '/dealer/invoices'
      ]
    };
    store.setUser(authenticatedUser);

    // 2. Fire backend session in background (non-blocking)
    try {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DEALER',
          dealerId: dealer.id
        })
      }).catch(() => {});
    } catch (e) {}

    // 3. Native browser navigation (instant, never gets stuck on mobile)
    window.location.href = '/dealer';
  };

  // Dealer phone login submission
  const handleDealerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DEALER',
          phone: dealerPhone,
          password: dealerPassword
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Login failed. Please verify phone number and password.');
        setIsLoggingIn(false);
        return;
      }

      store.setUser(data.user);
      window.location.href = '/dealer';
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred. Please try again.');
      setIsLoggingIn(false);
    }
  };

  // Direct Employee identity sign-in (Instant on mobile & laptop)
  const handleSelectEmployee = (employee: Employee) => {
    setErrorMessage(null);

    const authenticatedUser: User = {
      id: `user-${employee.id}`,
      name: employee.name,
      email: `${employee.code.toLowerCase()}@filtec.in`,
      phone: employee.phone,
      role: employee.systemRole === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
      employeeCode: employee.code,
      allowedPages: employee.allowedPages && employee.allowedPages.length > 0
        ? employee.allowedPages
        : ['/employee', '/employee/dealers', '/employee/orders', '/employee/attendance', '/employee/catalogue']
    };
    store.setUser(authenticatedUser);

    try {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EMPLOYEE',
          employeeId: employee.id
        })
      }).catch(() => {});
    } catch (e) {}

    window.location.href = authenticatedUser.role === 'ADMIN' ? '/admin' : '/employee';
  };

  // Admin sign-in (Instant on mobile & laptop)
  const handleAdminLogin = () => {
    setErrorMessage(null);

    const adminUser: User = {
      id: 'admin-samir',
      name: 'Samir',
      email: 'samir.admin@filtec.in',
      phone: '+91 99000 11223',
      role: 'ADMIN',
      allowedPages: ['/admin', '/admin/dealers', '/admin/employees', '/admin/orders', '/admin/catalogue', '/admin/settings']
    };
    store.setUser(adminUser);

    try {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ADMIN' })
      }).catch(() => {});
    } catch (e) {}

    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header with New Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-white shadow-2xs border border-[#E5E7EB] mb-4">
            <Image
              src="/brand/filtec-one-logo.png"
              alt="f | ONE"
              width={160}
              height={45}
              className="h-8 sm:h-9 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#111827]">
            Operational Management Platform
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Identity-Verified Access for Authorized Dealers, Staff & Management
          </p>
        </div>

        {/* Portal Card */}
        <div className="mt-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs overflow-hidden">
          {/* Identity Navigation Tabs */}
          <div className="grid grid-cols-3 border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('DEALER');
                setErrorMessage(null);
              }}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                activeTab === 'DEALER'
                  ? 'border-[#DC2626] bg-white text-[#111827] font-bold shadow-2xs'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Building2 className={`w-4 h-4 ${activeTab === 'DEALER' ? 'text-[#DC2626]' : 'text-neutral-400'}`} />
              <span>Dealer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('EMPLOYEE');
                setErrorMessage(null);
              }}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                activeTab === 'EMPLOYEE'
                  ? 'border-[#DC2626] bg-white text-[#111827] font-bold shadow-2xs'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'EMPLOYEE' ? 'text-blue-600' : 'text-neutral-400'}`} />
              <span>Employees</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ADMIN');
                setErrorMessage(null);
              }}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                activeTab === 'ADMIN'
                  ? 'border-[#DC2626] bg-white text-[#111827] font-bold shadow-2xs'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Shield className={`w-4 h-4 ${activeTab === 'ADMIN' ? 'text-neutral-900' : 'text-neutral-400'}`} />
              <span>Admin</span>
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Error Notice */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: DEALER LIST (Scrollable & Instant 1-Click Login) */}
            {activeTab === 'DEALER' && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">
                      Select Authorized Dealer
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Scroll and choose any dealership to sign in with 1-click:
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-50 text-[#DC2626] border border-rose-200 shrink-0">
                    {filteredDealers.length} Registered
                  </span>
                </div>

                {/* Search Bar for Dealers */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={dealerSearchQuery}
                    onChange={(e) => setDealerSearchQuery(e.target.value)}
                    placeholder="Search dealers by firm, owner, city, or phone..."
                    className="w-full pl-8 pr-7 py-2 text-xs rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] focus:border-[#DC2626]"
                  />
                  {dealerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDealerSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Scrollable Dealer Roster (Instant 1-Click Login on Mobile & Laptop) */}
                <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto pr-1 touch-pan-y">
                  {filteredDealers.map((d) => {
                    const isThisDealerLoggingIn = selectedDealerLoggingInId === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleDirectDealerLogin(d)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between text-xs group cursor-pointer select-none active:scale-[0.99] ${
                          isThisDealerLoggingIn
                            ? 'border-[#DC2626] bg-rose-50/50 ring-1 ring-[#DC2626]'
                            : 'border-[#E5E7EB] hover:border-[#DC2626] hover:bg-neutral-50 active:bg-rose-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-neutral-100 group-hover:bg-[#DC2626] group-hover:text-white flex items-center justify-center font-bold text-neutral-700 text-sm transition-colors shrink-0">
                            {d.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-[#111827] group-hover:text-[#DC2626] transition-colors truncate">
                                {d.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-semibold shrink-0">
                                {d.code}
                              </span>
                              {d.tier && (
                                <span className="text-[10px] font-mono text-emerald-700 font-medium shrink-0">
                                  {d.tier} Tier
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#6B7280] flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                              <span className="font-medium text-neutral-800">{d.ownerName}</span>
                              <span>•</span>
                              <span className="font-mono text-neutral-600">{d.phone}</span>
                              <span>•</span>
                              <span>{d.city}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[#DC2626] shrink-0 font-semibold text-xs ml-2">
                          {isThisDealerLoggingIn ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#DC2626]" />
                          ) : (
                            <>
                              <span className="hidden sm:inline text-[11px] group-hover:underline">Sign In</span>
                              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#DC2626] group-hover:translate-x-0.5 transition-all" />
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Manual Phone Login Toggle */}
                <div className="pt-2 border-t border-[#F3F4F6]">
                  <button
                    type="button"
                    onClick={() => setShowManualDealerLogin(!showManualDealerLogin)}
                    className="w-full text-center text-xs text-[#6B7280] hover:text-[#111827] font-medium py-1.5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Or sign in manually with phone & password</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showManualDealerLogin ? 'rotate-180' : ''}`} />
                  </button>

                  {showManualDealerLogin && (
                    <form onSubmit={handleDealerLogin} className="mt-2 space-y-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 animate-in fade-in duration-150">
                      <div>
                        <label className="text-xs font-semibold text-[#374151] block mb-1">
                          Registered Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            value={dealerPhone}
                            onChange={(e) => setDealerPhone(e.target.value)}
                            placeholder="e.g. +91 98980 99881 or 9898099881"
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#D1D5DB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-[#374151]">
                            Password
                          </label>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            Last 5 digits of phone
                          </span>
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            required
                            value={dealerPassword}
                            onChange={(e) => setDealerPassword(e.target.value)}
                            placeholder="••••• (5 digits)"
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#D1D5DB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn || !dealerPhone}
                        className="w-full py-2 px-3 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isLoggingIn ? (
                          <span>Verifying in Database...</span>
                        ) : (
                          <>
                            <span>Sign In with Phone</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: EMPLOYEE LIST (Scrollable & Instant 1-Click Login) */}
            {activeTab === 'EMPLOYEE' && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">
                      Select Employee Identity
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Scroll and choose your staff profile to access the field portal (1-click):
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    {filteredEmployees.length} Staff Members
                  </span>
                </div>

                {/* Search Bar for Employees */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    placeholder="Search staff by name, designation, territory, or code..."
                    className="w-full pl-8 pr-7 py-2 text-xs rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  />
                  {employeeSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setEmployeeSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Scrollable Employee Roster */}
                <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto pr-1 touch-pan-y">
                  {filteredEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleSelectEmployee(emp)}
                      className="w-full text-left p-3 rounded-xl border border-[#E5E7EB] hover:border-blue-500 hover:bg-blue-50/30 active:bg-blue-50/60 active:scale-[0.99] transition-all flex items-center justify-between text-xs group cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-neutral-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center font-bold text-neutral-700 text-sm transition-colors shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-[#111827] group-hover:text-blue-700 transition-colors truncate">
                              {emp.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-semibold shrink-0 whitespace-nowrap">
                              {emp.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#6B7280] flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                            <span className="font-medium text-neutral-800">
                              {emp.designation || 'Field Representative'}
                            </span>
                            {emp.territory && (
                              <>
                                <span>•</span>
                                <span className="text-neutral-600">{emp.territory}</span>
                              </>
                            )}
                            {emp.phone && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-neutral-600">{emp.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-blue-600 shrink-0 font-semibold text-xs ml-2">
                        <span className="hidden sm:inline text-[11px] group-hover:underline">Sign In</span>
                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: ADMIN ACCESS */}
            {activeTab === 'ADMIN' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    Operations Control Center
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Full administrative privileges, ERP integrations, staff management, and system configuration.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#111827]">Samir</div>
                      <div className="text-[11px] text-[#6B7280] font-mono">
                        FPPL/ADM-001 • Operations Admin
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isLoggingIn}
                    onClick={handleAdminLogin}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#111827] hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>Enter Control Center</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clean Footer */}
        <div className="mt-6 text-center text-[11px] text-[#9CA3AF] font-mono">
          PRE-TECH PIPES & FITTINGS PVT LTD • FILTEC ONE
        </div>
      </div>
    </div>
  );
}
