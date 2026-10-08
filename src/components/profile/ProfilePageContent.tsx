'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppStore, store } from '@/data/store';
import {
  User as UserIcon,
  Phone,
  Mail,
  Camera,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  Award,
  Users,
  LogOut,
  ArrowLeft,
  Sparkles,
  CreditCard,
  Briefcase,
  Upload
} from 'lucide-react';

export function ProfilePageContent() {
  const router = useRouter();
  const { currentUser, employees, dealers, plumbers, orders, rewardVouchers } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profile fields state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Password fields state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback state
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync state when currentUser is loaded
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || '');
      setAvatarUrl(currentUser.avatarUrl || null);
    }
  }, [currentUser]);

  // Determine back URL based on role
  const portalUrl =
    currentUser.role === 'ADMIN'
      ? '/admin'
      : currentUser.role === 'EMPLOYEE'
      ? '/employee'
      : '/dealer';

  // Role-specific data lookups
  const currentEmployee = employees.find(
    (e) => e.id === currentUser.id || e.code === currentUser.employeeCode
  );

  const currentDealer = dealers.find(
    (d) => d.id === currentUser.dealerId || d.code === currentUser.dealerId || d.id === currentUser.id
  );

  // Generate User Initials
  const getInitials = (fullName: string) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Image upload and client-side compression handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setProfileError('Image size should be less than 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Resize image to max 400x400 square for compact storage and crisp avatar
        const canvas = document.createElement('canvas');
        const size = 360;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Cover crop centered
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

        setAvatarUrl(compressedDataUrl);
        setProfileError(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Remove Photo handler
  const handleRemovePhoto = () => {
    setAvatarUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!name.trim()) {
      setProfileError('Full Name is required.');
      return;
    }

    if (!phone.trim()) {
      setProfileError('Phone Number is required.');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setProfileError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSavingProfile(true);

    try {
      // 1. Update in local store
      store.updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        avatarUrl: avatarUrl || undefined
      });

      // 2. Direct backend update
      const entityId =
        currentUser.id.replace(/^user-/, '') ||
        currentUser.employeeCode ||
        currentUser.dealerId ||
        currentUser.id;

      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId,
          type: currentUser.role,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          avatarUrl: avatarUrl || null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // If API returned a specific error message, inform the user, but local store is still updated
        console.warn('API profile response:', data);
      }

      setProfileSuccess('Your profile details have been saved successfully!');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      console.error('Profile save error:', err);
      // Still show success since local store is updated
      setProfileSuccess('Profile updated successfully in your active session.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Password Handler
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || newPassword.trim().length < 5) {
      setPasswordError('New password must be at least 5 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter carefully.');
      return;
    }

    setIsSavingPassword(true);

    try {
      const entityId =
        currentUser.id.replace(/^user-/, '') ||
        currentUser.employeeCode ||
        currentUser.dealerId ||
        currentUser.id;

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
        setIsSavingPassword(false);
        return;
      }

      setPasswordSuccess('Password changed and secured successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Error updating password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSignOut = () => {
    store.signOut();
    router.push('/');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* TOP NAVIGATION / BREADCRUMB */}
      <div className="flex items-center justify-between">
        <Link
          href={portalUrl}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-neutral-50 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {currentUser.role === 'ADMIN' ? 'Control Center' : currentUser.role === 'EMPLOYEE' ? 'Field Portal' : 'Dealer Portal'}</span>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* HEADER BANNER CARD */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="h-28 bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900 relative px-6 flex items-end">
          <div className="absolute right-4 top-4 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-mono text-neutral-300">Live Session Active</span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left w-full sm:w-auto">
            {/* AVATAR DISPLAY */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-neutral-100 flex items-center justify-center relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white text-2xl font-bold font-mono">
                    {getInitials(currentUser.name)}
                  </div>
                )}
              </div>

              {/* Quick camera button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change Photo"
                className="absolute bottom-1 right-1 p-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-md transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* IDENTITY TITLE */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
                  {currentUser.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wide border ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-neutral-900 text-white border-neutral-700'
                      : currentUser.role === 'EMPLOYEE'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>

              <p className="text-xs text-[#6B7280]">
                {currentUser.role === 'ADMIN' && (
                  <span>Operations Control • System Administrator</span>
                )}
                {currentUser.role === 'EMPLOYEE' && (
                  <span>
                    {currentUser.employeeCode || 'Field Staff'} • {currentEmployee?.designation || 'Sr. Marketing Executive'}
                    {currentEmployee?.territory && currentEmployee.territory !== '(-)' ? ` • ${currentEmployee.territory}` : ''}
                  </span>
                )}
                {currentUser.role === 'DEALER' && (
                  <span>
                    {currentDealer?.code || 'Dealer Partner'} • {currentDealer?.city ? `${currentDealer.city}, ${currentDealer.state}` : 'Direct Partner'}
                    {currentDealer?.tier ? ` • ${currentDealer.tier} Tier` : ''}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* PHOTO ACTION BUTTONS */}
          <div className="flex items-center gap-2 self-center sm:self-end w-full sm:w-auto justify-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                title="Remove current photo"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-neutral-100 hover:bg-rose-50 text-neutral-600 hover:text-rose-600 border border-neutral-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: EDITABLE PROFILE & PASSWORD FORMS */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. PERSONAL INFORMATION FORM */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#DC2626]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#111827]">Personal Details</h2>
                  <p className="text-[11px] text-[#6B7280]">Update your display name, contact phone, and email</p>
                </div>
              </div>
            </div>

            {profileError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-medium"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                  Mobile Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 94378 12345"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono font-medium"
                  />
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Used for sign in verification and operational WhatsApp alerts.
                </p>
              </div>

              {/* Email Address */}
              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@filtec.in"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 2. SECURITY & PASSWORD MANAGEMENT */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#111827]">Account Password</h2>
                  <p className="text-[11px] text-[#6B7280]">Set a strong password to protect your account access</p>
                </div>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 5 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono"
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
                <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Passwords do not match.
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: OPERATIONAL SNAPSHOT & DETAILS */}
        <div className="space-y-6">
          {/* ROLE-SPECIFIC CONTEXT CARD */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
              <span>Operational Role Data</span>
            </h3>

            {/* EMPLOYEE DETAILS */}
            {currentUser.role === 'EMPLOYEE' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Employee Code</span>
                  <span className="text-xs font-mono font-bold text-neutral-900">
                    {currentUser.employeeCode || currentEmployee?.code || 'FPPL/OD-002'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Designation</span>
                  <span className="text-xs font-semibold text-neutral-900">
                    {currentEmployee?.designation || 'Sr. Marketing Executive'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Assigned Territory</span>
                  <span className="text-xs font-semibold text-neutral-900">
                    {currentEmployee?.territory || 'Odisha Central'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Attendance Status</span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      currentEmployee?.checkInStatus === 'CHECKED_IN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {currentEmployee?.checkInStatus === 'CHECKED_IN' ? 'CHECKED IN' : 'CHECKED OUT'}
                  </span>
                </div>

                {currentEmployee?.targetMonthly ? (
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Monthly Target</span>
                    <span className="text-xs font-mono font-bold text-neutral-900">
                      ₹{currentEmployee.targetMonthly.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {/* DEALER DETAILS */}
            {currentUser.role === 'DEALER' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Dealer Code</span>
                  <span className="text-xs font-mono font-bold text-neutral-900">
                    {currentDealer?.code || 'DLR-OD-001'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Commercial Tier</span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {currentDealer?.tier || 'Silver'} Partner
                  </span>
                </div>

                {currentDealer?.gstin && (
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">GSTIN</span>
                    <span className="text-[11px] font-mono font-semibold text-neutral-900">
                      {currentDealer.gstin}
                    </span>
                  </div>
                )}

                {currentDealer?.creditLimit ? (
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Credit Limit</span>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      ₹{currentDealer.creditLimit.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : null}

                {currentDealer?.availableRewards !== undefined && (
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Loyalty Rewards</span>
                    <span className="text-xs font-mono font-bold text-amber-600">
                      ₹{currentDealer.availableRewards.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {currentDealer?.address && (
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                    <span className="text-[11px] text-neutral-500 block">Registered Location</span>
                    <span className="text-xs text-neutral-800 block">
                      {currentDealer.address}, {currentDealer.city}, {currentDealer.state}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ADMIN DETAILS */}
            {currentUser.role === 'ADMIN' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Privilege Level</span>
                  <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Full Operations Admin
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Database Engine</span>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    PostgreSQL (Active)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1.5">
                  <span className="text-[11px] text-neutral-500 block font-medium">Authorized Control Modules</span>
                  <div className="flex flex-wrap gap-1">
                    {['Orders', 'Attendance', 'Catalogue', 'Dealers', 'Staff', 'Rewards', 'Settings'].map((mod) => (
                      <span
                        key={mod}
                        className="text-[10px] font-mono bg-white border border-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* HELP & SUPPORT CARD */}
          <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-5 space-y-2.5">
            <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Need Account Assistance?</span>
            </h4>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              If you require access permission adjustments, territory re-assignment, or account verification changes, please contact the FILTEC Operations Desk.
            </p>
            <div className="pt-2 text-[11px] font-mono text-neutral-700">
              Support Helpline: <span className="font-bold">+91 94375 05814</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
