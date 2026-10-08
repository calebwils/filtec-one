'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { store } from '@/data/store';
import { User, Role } from '@/types';
import {
  Shield,
  Building2,
  ArrowRight,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  CheckCircle2,
  Loader2,
  UserPlus,
  KeyRound,
  MapPin,
  Briefcase,
  FileText
} from 'lucide-react';

type LoginRole = 'EMPLOYEE' | 'DEALER' | 'ADMIN';
type AuthMode = 'SIGN_IN' | 'REGISTER';
type RegisterRole = 'DEALER' | 'EMPLOYEE';

interface PendingFirstLogin {
  entityId: string;
  type: LoginRole;
  name: string;
  phone: string;
  user: User;
}

export default function LoginPage() {
  const router = useRouter();

  // Mode: Sign in or Register
  const [authMode, setAuthMode] = useState<AuthMode>('SIGN_IN');
  const [activeTab, setActiveTab] = useState<LoginRole>('EMPLOYEE');

  // Sign in form state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // First time login state
  const [pendingFirstLogin, setPendingFirstLogin] = useState<PendingFirstLogin | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  // Register form state
  const [registerRole, setRegisterRole] = useState<RegisterRole>('DEALER');
  const [regName, setRegName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('Odisha');
  const [regAddress, setRegAddress] = useState('');
  const [regGstin, setRegGstin] = useState('');
  const [regDesignation, setRegDesignation] = useState('Field Representative');
  const [regTerritory, setRegTerritory] = useState('Bhubaneswar Hub');
  const [regEmail, setRegEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  // Handle Sign In submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRegisterSuccess(null);

    if (!phone.trim()) {
      setErrorMessage('Please enter your registered phone number.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          password: password.trim(),
          type: activeTab
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Authentication failed. Please verify your phone and password.');
        setIsLoggingIn(false);
        return;
      }

      // Check if this is first-time login (must change password)
      if (data.mustChangePassword) {
        setPendingFirstLogin({
          entityId: data.entityId,
          type: data.type,
          name: data.user.name,
          phone: data.user.phone,
          user: data.user
        });
        setIsLoggingIn(false);
        return;
      }

      // Successful direct login
      store.setUser(data.user);

      if (data.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.role === 'EMPLOYEE') {
        router.push('/employee');
      } else {
        router.push('/dealer');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to authentication server. Please check your network.');
      setIsLoggingIn(false);
    }
  };

  // Handle First-Time Password Set submission
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);

    if (!newPassword || newPassword.trim().length < 5) {
      setPasswordChangeError('New password must be at least 5 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError('Passwords do not match. Please re-enter both correctly.');
      return;
    }

    if (!pendingFirstLogin) return;

    setIsChangingPassword(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: pendingFirstLogin.entityId,
          type: pendingFirstLogin.type,
          newPassword: newPassword.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPasswordChangeError(data.error || 'Failed to save new password. Please try again.');
        setIsChangingPassword(false);
        return;
      }

      // Password successfully saved! Update store session and redirect
      const updatedUser = {
        ...pendingFirstLogin.user,
        mustChangePassword: false
      };
      store.setUser(updatedUser);

      if (updatedUser.role === 'ADMIN') {
        router.push('/admin');
      } else if (updatedUser.role === 'EMPLOYEE') {
        router.push('/employee');
      } else {
        router.push('/dealer');
      }
    } catch (err: any) {
      setPasswordChangeError(err.message || 'Error occurred while saving new password.');
      setIsChangingPassword(false);
    }
  };

  // Handle Account Registration submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRegisterSuccess(null);

    if (!regPhone.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }

    if (!regPassword || regPassword.trim().length < 5) {
      setErrorMessage('Password must be at least 5 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please confirm your password.');
      return;
    }

    setIsRegistering(true);

    try {
      const payload: any = {
        role: registerRole,
        phone: regPhone.trim(),
        password: regPassword.trim(),
        name: regName.trim(),
        email: regEmail.trim() || undefined
      };

      if (registerRole === 'DEALER') {
        payload.ownerName = regOwnerName.trim() || regName.trim();
        payload.city = regCity.trim() || 'Odisha';
        payload.state = regState.trim() || 'Odisha';
        payload.address = regAddress.trim() || 'Odisha, India';
        payload.gstin = regGstin.trim() || undefined;
      } else {
        payload.designation = regDesignation.trim();
        payload.territory = regTerritory.trim();
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to create account. Please verify input.');
        setIsRegistering(false);
        return;
      }

      // Registration successful! Set user into store and navigate
      store.setUser(data.user);
      setRegisterSuccess('Account created successfully! Logging you in...');

      setTimeout(() => {
        if (data.user.role === 'EMPLOYEE') {
          router.push('/employee');
        } else {
          router.push('/dealer');
        }
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred during registration.');
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-white shadow-2xs border border-[#E5E7EB] mb-4">
            <Image
              src="/brand/filtec-one-logo.png"
              alt="FILTEC ONE"
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
          {/* Main Mode Toggle: Sign In vs Create Account */}
          <div className="flex border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('SIGN_IN');
                setErrorMessage(null);
                setRegisterSuccess(null);
              }}
              className={`flex-1 py-3 px-3 text-center transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'SIGN_IN'
                  ? 'border-[#DC2626] bg-white text-[#111827] font-bold shadow-2xs'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTER');
                setErrorMessage(null);
                setRegisterSuccess(null);
              }}
              className={`flex-1 py-3 px-3 text-center transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'REGISTER'
                  ? 'border-[#DC2626] bg-white text-[#111827] font-bold shadow-2xs'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Create Account</span>
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Error Banner */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Banner */}
            {registerSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{registerSuccess}</span>
              </div>
            )}

            {/* ===================== MODE 1: SIGN IN ===================== */}
            {authMode === 'SIGN_IN' && (
              <div className="space-y-4">
                {/* Role Tabs for Sign In */}
                <div className="grid grid-cols-3 p-1 bg-neutral-100 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('EMPLOYEE');
                      setErrorMessage(null);
                    }}
                    className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'EMPLOYEE'
                        ? 'bg-white text-blue-700 shadow-xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Employee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('DEALER');
                      setErrorMessage(null);
                    }}
                    className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'DEALER'
                        ? 'bg-white text-[#DC2626] shadow-xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Dealer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('ADMIN');
                      setErrorMessage(null);
                    }}
                    className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'ADMIN'
                        ? 'bg-white text-neutral-900 shadow-xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                </div>

                <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200">
                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                    {activeTab === 'EMPLOYEE' && (
                      <>
                        <span className="font-semibold text-neutral-900">Staff Portal: </span>
                        Sign in with your registered phone number. If it is your first time, your password is the <span className="font-semibold text-blue-700">last 5 digits of your phone</span>.
                      </>
                    )}
                    {activeTab === 'DEALER' && (
                      <>
                        <span className="font-semibold text-neutral-900">Dealer Portal: </span>
                        Sign in with your authorized dealership phone. If it is your first time, your password is the <span className="font-semibold text-[#DC2626]">last 5 digits of your phone</span>.
                      </>
                    )}
                    {activeTab === 'ADMIN' && (
                      <>
                        <span className="font-semibold text-neutral-900">Operations Control: </span>
                        Management and administrator login with phone and password.
                      </>
                    )}
                  </p>
                </div>

                {/* Sign In Form */}
                <form onSubmit={handleSignIn} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[#374151] block mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9437860619 or +91 94378 60619"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono text-neutral-900"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#374151]">
                        Password
                      </label>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Initial: Last 5 digits of phone
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono text-neutral-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn || !phone}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Switcher */}
                <div className="pt-3 border-t border-neutral-100 text-center">
                  <p className="text-xs text-neutral-500">
                    Don&apos;t have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('REGISTER');
                        setErrorMessage(null);
                      }}
                      className="text-[#DC2626] font-semibold hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ===================== MODE 2: CREATE ACCOUNT ===================== */}
            {authMode === 'REGISTER' && (
              <div className="space-y-4">
                {/* Account Type Selector */}
                <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('DEALER')}
                    className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      registerRole === 'DEALER'
                        ? 'bg-white text-[#DC2626] shadow-xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Dealer Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterRole('EMPLOYEE')}
                    className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      registerRole === 'EMPLOYEE'
                        ? 'bg-white text-blue-700 shadow-xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Employee Account</span>
                  </button>
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                  {/* Dealer Specific Fields */}
                  {registerRole === 'DEALER' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-[#374151] block mb-1">
                          Firm / Dealership Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Maa Tarini Sanitary & Hardware"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#374151] block mb-1">
                          Proprietor / Owner Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={regOwnerName}
                          onChange={(e) => setRegOwnerName(e.target.value)}
                          placeholder="e.g. Suresh Kumar Mohanty"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-[#374151] block mb-1">
                            City / Town *
                          </label>
                          <input
                            type="text"
                            required
                            value={regCity}
                            onChange={(e) => setRegCity(e.target.value)}
                            placeholder="e.g. Cuttack"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[#374151] block mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={regState}
                            onChange={(e) => setRegState(e.target.value)}
                            placeholder="Odisha"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#374151] block mb-1">
                          Business Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          placeholder="Shop No. 12, Main Market Road"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#374151] block mb-1">
                          GSTIN <span className="text-neutral-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={regGstin}
                          onChange={(e) => setRegGstin(e.target.value)}
                          placeholder="21AAAAA0000A1Z5"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono"
                        />
                      </div>
                    </>
                  )}

                  {/* Employee Specific Fields */}
                  {registerRole === 'EMPLOYEE' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-[#374151] block mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Ramesh Chandra Behera"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-[#374151] block mb-1">
                            Designation *
                          </label>
                          <input
                            type="text"
                            required
                            value={regDesignation}
                            onChange={(e) => setRegDesignation(e.target.value)}
                            placeholder="Field Representative"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-[#374151] block mb-1">
                            Territory *
                          </label>
                          <input
                            type="text"
                            required
                            value={regTerritory}
                            onChange={(e) => setRegTerritory(e.target.value)}
                            placeholder="Bhubaneswar"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#374151] block mb-1">
                          Email Address <span className="text-neutral-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="ramesh@filtec.in"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </>
                  )}

                  {/* Common Credentials */}
                  <div>
                    <label className="text-xs font-semibold text-[#374151] block mb-1">
                      Mobile Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="e.g. 9437812345"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-[#374151] block mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 5 characters"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#374151] block mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99] mt-2"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Registering account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create {registerRole === 'DEALER' ? 'Dealer' : 'Employee'} Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Switcher */}
                <div className="pt-3 border-t border-neutral-100 text-center">
                  <p className="text-xs text-neutral-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('SIGN_IN');
                        setErrorMessage(null);
                      }}
                      className="text-[#DC2626] font-semibold hover:underline cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </p>
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

      {/* ===================== FIRST-TIME LOGIN PASSWORD SETUP MODAL ===================== */}
      {pendingFirstLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-5 bg-[#111827] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#DC2626] flex items-center justify-center text-white shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Set Your Personal Password
                  </h3>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    First-Time Login Security Setup
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
                Welcome, <span className="font-bold">{pendingFirstLogin.name}</span>! You have successfully signed in with your default password. To secure your account, please replace it with a personal password of your choice.
              </div>

              {passwordChangeError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{passwordChangeError}</span>
                </div>
              )}

              <form onSubmit={handleSetNewPassword} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1">
                    New Personal Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 5 characters"
                      className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626] font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving your password...</span>
                      </>
                    ) : (
                      <>
                        <span>Save Password & Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
