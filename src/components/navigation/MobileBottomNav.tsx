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
  FileCheck,
  Award,
  Users,
  Building2,
  FileText,
  Activity,
  ScrollText,
  Radio,
  Settings,
  Shield,
  ArrowLeft
} from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { currentUser, orders, cart } = useAppStore();

  const pendingApprovalsCount = orders.filter((o) => o.status === 'SUBMITTED' || o.status === 'PENDING_ADMIN_APPROVAL').length;
  const cartItemsCount = cart.items.length;

  const isPageAllowed = (path: string) => {
    if (!currentUser.allowedPages || currentUser.allowedPages.length === 0) {
      return true;
    }
    return currentUser.allowedPages.includes(path);
  };

  const adminNavItems = [
    { path: '/admin', label: 'Control', icon: Activity },
    { path: '/admin/orders', label: 'Orders', icon: FileCheck, count: pendingApprovalsCount },
    { path: '/admin/catalogue', label: 'Catalogue', icon: BookOpen },
    { path: '/admin/dealers', label: 'Dealers', icon: Building2 },
    { path: '/admin/employees', label: 'Staff', icon: Users },
    { path: '/admin/settings', label: 'Settings', icon: Settings }
  ];

  const allowedAdminPages = adminNavItems.filter((p) => isPageAllowed(p.path));
  const isVisitingAdminPage = pathname.startsWith('/admin');

  // EMPLOYEE ROLE
  if (currentUser.role === 'EMPLOYEE') {
    // If employee is on an admin page
    if (isVisitingAdminPage) {
      return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] px-2 py-1.5 flex items-center justify-around shadow-lg md:hidden">
          <Link
            href="/employee"
            className="flex flex-col items-center py-1 px-2 rounded-md text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mb-0.5 text-neutral-600" />
            <span className="text-[10px] tracking-tight font-medium">Field Portal</span>
          </Link>

          {allowedAdminPages.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/admin' ? pathname === '/admin' : pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`relative flex flex-col items-center py-1 px-2 rounded-md transition-colors ${
                  isActive ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] tracking-tight">{item.label}</span>
                {item.count && item.count > 0 ? (
                  <span className="absolute top-0 right-1 bg-[#DC2626] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-mono font-bold">
                    {item.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      );
    }

    // Standard field view
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] px-2 py-1.5 flex items-center justify-around shadow-lg md:hidden">
        {isPageAllowed('/employee') && (
          <Link
            href="/employee"
            className={`flex flex-col items-center py-1 px-2 rounded-md transition-colors ${
              pathname === '/employee' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Today</span>
          </Link>
        )}

        {isPageAllowed('/employee/catalogue') && (
          <Link
            href="/employee/catalogue"
            className={`flex flex-col items-center py-1 px-2 rounded-md transition-colors ${
              pathname === '/employee/catalogue' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Catalogue</span>
          </Link>
        )}

        {/* Center Primary Action: New Order */}
        {isPageAllowed('/employee/orders') && (
          <Link
            href="/employee/orders/new"
            className="relative flex flex-col items-center -top-3"
          >
            <div className="w-11 h-11 rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-md hover:bg-[#B91C1C] transition-all">
              <PlusCircle className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-neutral-900 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-mono font-bold border-2 border-white">
                  {cartItemsCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-semibold text-[#DC2626] mt-0.5">Order</span>
          </Link>
        )}

        {isPageAllowed('/employee/attendance') && (
          <Link
            href="/employee/attendance"
            className={`flex flex-col items-center py-1 px-2 rounded-md transition-colors ${
              pathname === '/employee/attendance' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <Radio className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Punch</span>
          </Link>
        )}

        {/* Quick Admin Jump if employee has admin pages */}
        {allowedAdminPages.length > 0 && (
          <Link
            href={allowedAdminPages[0].path}
            className="flex flex-col items-center py-1 px-2 rounded-md text-rose-700 hover:text-rose-800 transition-colors"
          >
            <Shield className="w-5 h-5 mb-0.5 text-rose-600" />
            <span className="text-[10px] tracking-tight font-semibold">Admin</span>
          </Link>
        )}
      </nav>
    );
  }

  // DEALER ROLE
  if (currentUser.role === 'DEALER') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] px-2 py-1.5 flex items-center justify-around shadow-lg md:hidden">
        <Link
          href="/dealer"
          className={`flex flex-col items-center py-1 px-2 rounded-md transition-colors ${
            pathname === '/dealer' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Business</span>
        </Link>

        <Link
          href="/dealer/catalogue"
          className={`flex flex-col items-center py-1 px-2 rounded-md transition-colors ${
            pathname === '/dealer/catalogue' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Catalogue</span>
        </Link>

        <Link
          href="/dealer/orders"
          className={`flex flex-col items-center py-1 px-2 rounded-md transition-colors ${
            pathname.startsWith('/dealer/orders') ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Orders</span>
        </Link>

        <Link
          href="/dealer/rewards"
          className={`flex flex-col items-center py-1 px-2.5 rounded-md transition-colors ${
            pathname === '/dealer/rewards' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <Award className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Rewards</span>
        </Link>

        <Link
          href="/dealer/plumbers"
          className={`flex flex-col items-center py-1 px-2.5 rounded-md transition-colors ${
            pathname === '/dealer/plumbers' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Plumbers</span>
        </Link>

        <Link
          href="/dealer/invoices"
          className={`flex flex-col items-center py-1 px-2.5 rounded-md transition-colors ${
            pathname === '/dealer/invoices' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Invoices</span>
        </Link>
      </nav>
    );
  }

  // ADMIN ROLE
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] px-2 py-1.5 flex items-center justify-around shadow-lg md:hidden">
      {isPageAllowed('/admin') && (
        <Link
          href="/admin"
          className={`flex flex-col items-center py-1 px-2 rounded-md transition-colors ${
            pathname === '/admin' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <Activity className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Control</span>
        </Link>
      )}

      {isPageAllowed('/admin/orders') && (
        <Link
          href="/admin/orders"
          className={`relative flex flex-col items-center py-1 px-2 rounded-md transition-colors ${
            pathname.startsWith('/admin/orders') ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <FileCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Orders</span>
          {pendingApprovalsCount > 0 && (
            <span className="absolute top-0 right-1 bg-[#DC2626] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-mono font-bold">
              {pendingApprovalsCount}
            </span>
          )}
        </Link>
      )}

      {isPageAllowed('/admin/catalogue') && (
        <Link
          href="/admin/catalogue"
          className={`flex flex-col items-center py-1 px-2 rounded-md transition-colors ${
            pathname === '/admin/catalogue' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Catalogue</span>
        </Link>
      )}

      {isPageAllowed('/admin/dealers') && (
        <Link
          href="/admin/dealers"
          className={`flex flex-col items-center py-1 px-1.5 rounded-md transition-colors ${
            pathname === '/admin/dealers' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Dealers</span>
        </Link>
      )}

      {isPageAllowed('/admin/employees') && (
        <Link
          href="/admin/employees"
          className={`flex flex-col items-center py-1 px-1.5 rounded-md transition-colors ${
            pathname === '/admin/employees' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Staff</span>
        </Link>
      )}

      {isPageAllowed('/admin/settings') && (
        <Link
          href="/admin/settings"
          className={`flex flex-col items-center py-1 px-1.5 rounded-md transition-colors ${
            pathname === '/admin/settings' ? 'text-[#DC2626] font-medium' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Settings</span>
        </Link>
      )}
    </nav>
  );
}
