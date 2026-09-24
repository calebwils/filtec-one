'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/data/store';
import {
  Home,
  BookOpen,
  PlusCircle,
  Clock,
  Radio,
  FileCheck,
  Award,
  Users,
  Building2,
  FileText,
  Activity,
  UserCheck,
  Settings,
  Shield,
  ArrowLeft,
  BarChart3
} from 'lucide-react';

export function DesktopSubNav() {
  const pathname = usePathname();
  const { currentUser, orders, cart } = useAppStore();
  const pendingApprovalsCount = orders.filter((o) => o.status === 'SUBMITTED' || o.status === 'PENDING_ADMIN_APPROVAL').length;

  const isPageAllowed = (path: string) => {
    if (!currentUser.allowedPages || currentUser.allowedPages.length === 0) {
      return true;
    }
    return currentUser.allowedPages.includes(path);
  };

  const adminNavItems = [
    { path: '/admin', label: 'Control Center', icon: Activity },
    { path: '/dashboard', label: '⚡ Executive Cockpit', icon: BarChart3 },
    {
      path: '/admin/orders',
      label: 'Orders',
      icon: FileCheck,
      count: pendingApprovalsCount
    },
    { path: '/admin/attendance', label: 'Attendance & Tracking', icon: Radio },
    { path: '/admin/catalogue', label: 'Catalogue & Stock', icon: BookOpen },
    { path: '/admin/dealers', label: 'Dealers', icon: Building2 },
    { path: '/admin/employees', label: 'Staff', icon: Users },
    { path: '/admin/rewards', label: 'Rewards', icon: Award },
    { path: '/admin/settings', label: 'Settings', icon: Settings }
  ];

  const allowedAdminPages = adminNavItems.filter((p) => isPageAllowed(p.path));
  const isVisitingAdminPage = pathname.startsWith('/admin');

  return (
    <div className="hidden md:block bg-white border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <nav className="flex items-center space-x-6 text-xs font-medium overflow-x-auto">
          {/* 1. EMPLOYEE ROLE ON AN ADMIN PAGE */}
          {currentUser.role === 'EMPLOYEE' && isVisitingAdminPage && (
            <div className="flex items-center space-x-4">
              <Link
                href="/employee"
                className="py-1 px-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#111827] text-xs font-semibold flex items-center gap-1.5 transition-all mr-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Field Portal</span>
              </Link>

              <span className="text-[10px] font-mono uppercase font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
                <Shield className="w-3 h-3 text-rose-600" />
                Authorized Admin Modules:
              </span>

              {allowedAdminPages.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                        : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.count && item.count > 0 ? (
                      <span className="bg-neutral-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold">
                        {item.count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}

          {/* 2. EMPLOYEE ROLE ON FIELD PAGES */}
          {currentUser.role === 'EMPLOYEE' && !isVisitingAdminPage && (
            <>
              {isPageAllowed('/employee') && (
                <Link
                  href="/employee"
                  className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    pathname === '/employee'
                      ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                      : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  Today
                </Link>
              )}
              {isPageAllowed('/employee/dealers') && (
                <Link
                  href="/employee/dealers"
                  className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    pathname === '/employee/dealers'
                      ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                      : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Dealers
                </Link>
              )}
              {isPageAllowed('/employee/catalogue') && (
                <Link
                  href="/employee/catalogue"
                  className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    pathname === '/employee/catalogue'
                      ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                      : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Catalogue
                </Link>
              )}
              {isPageAllowed('/employee/orders') && (
                <Link
                  href="/employee/orders"
                  className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    pathname.startsWith('/employee/orders') && pathname !== '/employee/orders/new'
                      ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                      : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Orders
                </Link>
              )}
              {isPageAllowed('/employee/attendance') && (
                <Link
                  href="/employee/attendance"
                  className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    pathname === '/employee/attendance'
                      ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                      : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  Attendance
                </Link>
              )}

              {/* Permitted Admin Modules for Field Staff */}
              {allowedAdminPages.length > 0 && (
                <div className="flex items-center space-x-3 pl-4 border-l border-[#E5E7EB]">
                  <span className="text-[10px] font-mono font-bold uppercase text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                    <Shield className="w-2.5 h-2.5 text-rose-600" />
                    Admin Access:
                  </span>
                  {allowedAdminPages.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="py-3 border-b-2 border-transparent text-[#6B7280] hover:text-[#DC2626] transition-all flex items-center gap-1 text-xs whitespace-nowrap"
                      >
                        <Icon className="w-3 h-3 text-neutral-400" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* 3. DEALER ROLE */}
          {currentUser.role === 'DEALER' && (
            <>
              <Link
                href="/dealer"
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  pathname === '/dealer'
                    ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                Your Business
              </Link>
              <Link
                href="/dealer/catalogue"
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  pathname === '/dealer/catalogue'
                    ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Catalogue
              </Link>
              <Link
                href="/dealer/orders"
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  pathname.startsWith('/dealer/orders')
                    ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Orders
              </Link>
              <Link
                href="/dealer/rewards"
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  pathname === '/dealer/rewards'
                    ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Reward Ledger
              </Link>
              <Link
                href="/dealer/plumbers"
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  pathname === '/dealer/plumbers'
                    ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Plumbers
              </Link>
              <Link
                href="/dealer/invoices"
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  pathname === '/dealer/invoices'
                    ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Invoices
              </Link>
            </>
          )}

          {/* 4. ADMIN ROLE */}
          {currentUser.role === 'ADMIN' && (
            <>
              {adminNavItems.map((item) => {
                if (!isPageAllowed(item.path)) return null;
                const Icon = item.icon;
                const isActive =
                  item.path === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'border-[#DC2626] text-[#DC2626] font-semibold'
                        : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.count && item.count > 0 ? (
                      <span className="bg-neutral-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold">
                        {item.count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {currentUser.role === 'EMPLOYEE' && isPageAllowed('/employee/orders') && !isVisitingAdminPage && (
          <Link
            href="/employee/orders/new"
            className="inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-3 py-1.5 rounded transition-all shrink-0 ml-4"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Field Order</span>
            {cart.items.length > 0 && (
              <span className="bg-white text-[#DC2626] text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {cart.items.length}
              </span>
            )}
          </Link>
        )}
      </div>
    </div>
  );
}
