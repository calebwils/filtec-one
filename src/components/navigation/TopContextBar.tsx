'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore, store } from '@/data/store';
import { Role, Employee, Dealer } from '@/types';
import {
  Bell,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  ChevronRight,
  LogOut,
  Users,
  Building2,
  Shield,
  X
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export function TopContextBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { currentUser, orders, employees, dealers } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);

  const pendingApprovalsCount = orders.filter((o) => o.status === 'PENDING_ADMIN_APPROVAL').length;
  const allowedAdminPages = (currentUser.allowedPages || []).filter((p) => p.startsWith('/admin'));

  const handleAdminSwitch = () => {
    store.switchUser('ADMIN');
    router.push('/admin');
  };

  const handleSwitchToEmployee = (emp: Employee) => {
    const role: Role = (emp.systemRole as Role) || 'EMPLOYEE';
    store.setUser({
      id: `user-${emp.id}`,
      name: emp.name,
      email: emp.email || `${emp.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@filtec.in`,
      phone: emp.phone,
      role,
      employeeCode: emp.code,
      allowedPages: emp.allowedPages || (role === 'ADMIN'
        ? ['/admin', '/admin/orders', '/admin/attendance', '/admin/catalogue', '/admin/dealers', '/admin/employees', '/admin/rewards', '/admin/integrations', '/admin/audit', '/admin/settings']
        : ['/employee', '/employee/dealers', '/employee/catalogue', '/employee/orders', '/employee/attendance'])
    });
    setIsEmployeeModalOpen(false);
    if (role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/employee');
    }
  };

  const handleSwitchToDealer = (dlr: Dealer) => {
    store.setUser({
      id: `user-${dlr.id}`,
      name: dlr.name,
      email: `${dlr.code.toLowerCase()}@filtec-dealers.in`,
      phone: dlr.phone,
      role: 'DEALER',
      dealerId: dlr.id,
      allowedPages: [
        '/dealer',
        '/dealer/catalogue',
        '/dealer/orders',
        '/dealer/rewards',
        '/dealer/plumbers',
        '/dealer/invoices'
      ]
    });
    setIsDealerModalOpen(false);
    router.push('/dealer');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] shadow-xs">
        {/* Top micro bar */}
        <div className="bg-[#111827] text-white px-3 sm:px-6 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono font-medium tracking-tight text-neutral-300">PRE-TECH 1 • DATABASE CONNECTED</span>
            <span className="hidden sm:inline-block text-neutral-500">|</span>
            <span className="hidden sm:inline-block text-neutral-400">PostgreSQL: Active</span>
          </div>

          {/* Identity Switchers */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 hidden md:inline text-[11px] mr-1">Switch Identity:</span>

            <button
              type="button"
              onClick={handleAdminSwitch}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                currentUser.role === 'ADMIN'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-300 hover:text-white bg-neutral-800'
              }`}
            >
              Admin {pendingApprovalsCount > 0 && `(${pendingApprovalsCount})`}
            </button>

            <button
              type="button"
              onClick={() => setIsEmployeeModalOpen(true)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                currentUser.role === 'EMPLOYEE'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-300 hover:text-white bg-neutral-800'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Employees ({employees.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDealerModalOpen(true)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                currentUser.role === 'DEALER'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-300 hover:text-white bg-neutral-800'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Dealers ({dealers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/')}
              title="Disconnect and return to login portal"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-neutral-300 hover:text-rose-300 hover:bg-neutral-800 transition-all border-l border-neutral-700 ml-1.5 pl-2.5"
            >
              <LogOut className="w-3 h-3 text-neutral-400 hover:text-rose-300" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={
                currentUser.role === 'ADMIN'
                  ? '/admin'
                  : currentUser.role === 'EMPLOYEE'
                  ? '/employee'
                  : '/dealer'
              }
              className="flex items-center gap-2"
            >
              <div className="h-7 sm:h-8 flex items-center shrink-0">
                <Image
                  src="/brand/filtec-one-logo.png"
                  alt="FILTEC ONE"
                  width={130}
                  height={32}
                  className="h-6 sm:h-7 w-auto object-contain"
                  priority
                />
              </div>
            </Link>

            {(title || subtitle) && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#E5E7EB]">
                {title && <h1 className="font-semibold text-sm text-[#111827]">{title}</h1>}
                {subtitle && <span className="text-xs text-[#6B7280]">• {subtitle}</span>}
              </div>
            )}
          </div>

          {/* User Context, Role Pill & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-[#111827]">{currentUser.name}</div>
              <div className="text-[10px] text-[#6B7280] font-mono">
                {currentUser.role === 'ADMIN'
                  ? 'Operations Control'
                  : currentUser.role === 'EMPLOYEE'
                  ? `${currentUser.employeeCode || 'Field Staff'}`
                  : 'Dealer Partner'}
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                currentUser.role === 'ADMIN'
                  ? 'bg-neutral-100 text-neutral-800 border-neutral-300'
                  : currentUser.role === 'EMPLOYEE'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {currentUser.role}
            </span>

            {currentUser.role === 'EMPLOYEE' && allowedAdminPages.length > 0 && (
              <Link
                href={allowedAdminPages[0]}
                title="Access Authorized Admin Modules"
                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded transition-colors"
              >
                <ShieldCheck className="w-3 h-3 text-rose-600" />
                <span className="hidden sm:inline">Admin Access</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => router.push('/')}
              title="Sign Out to Login Portal"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E5E7EB] hover:bg-neutral-50 text-[#374151] text-xs font-medium transition-all shadow-2xs active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* EMPLOYEE SELECTION MODAL */}
      {isEmployeeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsEmployeeModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-neutral-900">Switch Employee Identity</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleSwitchToEmployee(emp)}
                  className="w-full text-left p-3 rounded-xl border border-neutral-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center font-bold text-neutral-700 transition-colors">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <span>{emp.name}</span>
                        <span className="text-[10px] font-mono text-neutral-500">{emp.code}</span>
                      </div>
                      <div className="text-[11px] text-neutral-600 mt-0.5">
                        {emp.designation || 'Field Officer'} • {emp.phone}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DEALER SELECTION MODAL */}
      {isDealerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsDealerModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#DC2626]" />
                <h3 className="font-bold text-sm text-neutral-900">Switch Dealer Partner</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDealerModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {dealers.map((dlr) => (
                <button
                  key={dlr.id}
                  type="button"
                  onClick={() => handleSwitchToDealer(dlr)}
                  className="w-full text-left p-3 rounded-xl border border-neutral-200 hover:border-[#DC2626] hover:bg-neutral-50 transition-all flex items-center justify-between text-xs group"
                >
                  <div>
                    <span className="font-bold text-neutral-900 block">{dlr.name}</span>
                    <span className="text-[11px] font-mono text-neutral-600">
                      {dlr.phone} • {dlr.city} ({dlr.tier} Partner)
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#DC2626]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
