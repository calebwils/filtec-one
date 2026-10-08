'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore, store } from '@/data/store';
import {
  ShieldCheck,
  LogOut,
  KeyRound,
  Shield,
  X,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TopContextBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { currentUser } = useAppStore();
  const router = useRouter();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const allowedAdminPages = (currentUser.allowedPages || []).filter((p) => p.startsWith('/admin'));

  const handleSignOut = () => {
    // Reset to login
    router.push('/');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || newPassword.trim().length < 5) {
      setPasswordError('New password must be at least 5 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsSubmittingPassword(true);

    try {
      const entityId = currentUser.id.replace(/^user-/, '') || currentUser.employeeCode || currentUser.dealerId || currentUser.id;
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId,
          type: currentUser.role,
          newPassword: newPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPasswordError(data.error || 'Failed to update password.');
        setIsSubmittingPassword(false);
        return;
      }

      setPasswordSuccess('Password updated successfully!');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Error updating password.');
    } finally {
      setIsSubmittingPassword(false);
    }
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

          {/* Authenticated User Status & Actions */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 hidden md:inline text-[11px]">
              Logged in: <span className="text-white font-medium">{currentUser.name}</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(true);
                setPasswordError(null);
                setPasswordSuccess(null);
              }}
              title="Change Password"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-all cursor-pointer"
            >
              <KeyRound className="w-3 h-3 text-neutral-400" />
              <span className="hidden sm:inline">Change Password</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out of your session"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-rose-300 hover:text-rose-200 bg-neutral-800 hover:bg-rose-950/50 transition-all cursor-pointer ml-1"
            >
              <LogOut className="w-3 h-3 text-rose-400" />
              <span>Sign Out</span>
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
              onClick={handleSignOut}
              title="Sign Out to Login Portal"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E5E7EB] hover:bg-neutral-50 text-[#374151] text-xs font-medium transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#DC2626]" />
                <h3 className="font-bold text-sm text-neutral-900">Change Your Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {passwordError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 5 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword || !newPassword || !confirmPassword}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
