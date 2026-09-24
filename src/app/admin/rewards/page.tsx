'use client';

import React, { useState, useEffect } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore, store } from '@/data/store';
import { RewardVoucherCard } from '@/components/rewards/RewardVoucherCard';
import { RewardVoucher } from '@/types';
import {
  Award,
  Sliders,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Loader2,
  Lock,
  Unlock,
  Ticket,
  FileCheck2,
  X,
  Printer,
  Check,
  CreditCard,
  Building,
  Phone,
  Search,
  Copy,
  ExternalLink,
  Wallet,
  Zap,
  Banknote,
  Send,
  AlertCircle
} from 'lucide-react';

export default function AdminRewardsPage() {
  const { rewardConfig, rewardLedger, rewardVouchers, dealers } = useAppStore();

  const [rate, _setRate] = useState(rewardConfig.ratePercent);
  const [dealerShare, _setDealerShare] = useState(rewardConfig.dealerSharePercent);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Tab State: TRANSACTIONS vs VOUCHERS
  const [activeLedgerTab, setActiveLedgerTab] = useState<'VOUCHERS' | 'TRANSACTIONS'>('VOUCHERS');
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<RewardVoucher | null>(null);

  // Voucher Filter & Search State
  const [voucherFilter, setVoucherFilter] = useState<'ALL' | 'PENDING' | 'SETTLED'>('ALL');
  const [voucherSearch, setVoucherSearch] = useState('');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Settlement Modal State
  const [settleModalVoucher, setSettleModalVoucher] = useState<RewardVoucher | null>(null);
  const [settleMode, setSettleMode] = useState<'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CREDIT_NOTE'>('UPI');
  const [settleRef, setSettleRef] = useState('');
  const [settledBy, setSettledBy] = useState('Samir (Admin)');
  const [settleNotes, setSettleNotes] = useState('');
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);
  const [settleToast, setSettleToast] = useState<string | null>(null);

  // Auto-sync database every 10 seconds so Admin receives vouchers in real-time
  useEffect(() => {
    store.syncWithDatabase(true);
    const interval = setInterval(() => {
      store.syncWithDatabase(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isDirty) {
      _setRate(rewardConfig.ratePercent);
      _setDealerShare(rewardConfig.dealerSharePercent);
    }
  }, [rewardConfig, isDirty]);

  const setRate = (val: any) => {
    setIsDirty(true);
    _setRate(val);
  };
  const setDealerShare = (val: any) => {
    setIsDirty(true);
    _setDealerShare(val);
  };

  const handleSavePolicy = async () => {
    setIsSaving(true);
    try {
      store.updateRewardConfig({
        ratePercent: Number(rate),
        dealerSharePercent: Number(dealerShare),
        plumberSharePercent: 100 - Number(dealerShare)
      });
      setIsDirty(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const openSettlementModal = (voucher: RewardVoucher) => {
    setSettleModalVoucher(voucher);
    if (voucher.type === 'PLUMBER') {
      setSettleMode('UPI');
      setSettleRef('');
      setSettleNotes(`Settlement paid to Plumber ${voucher.plumberName || ''} (${voucher.plumberPhone || ''})`);
    } else {
      setSettleMode('CREDIT_NOTE');
      setSettleRef(`CN-2026-${Math.floor(100 + Math.random() * 900)}`);
      setSettleNotes(`Credit note issued to Dealer ${voucher.dealerName}`);
    }
    setSettledBy('Samir (Admin)');
  };

  const handleConfirmSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModalVoucher) return;

    setIsSubmittingSettle(true);
    try {
      const mode = settleMode;
      const ref = settleRef.trim() || (mode === 'CREDIT_NOTE' ? `CN-2026-${Math.floor(100 + Math.random() * 900)}` : 'PAID-REF');
      
      store.settleVoucher(settleModalVoucher.id, {
        paymentMode: mode,
        paymentReference: ref,
        creditNoteNumber: mode === 'CREDIT_NOTE' ? ref : undefined,
        settledBy: settledBy.trim() || 'Samir (Admin)',
        notes: settleNotes.trim() || undefined
      });

      setSettleToast(
        `✓ Voucher ${settleModalVoucher.voucherNumber} settled successfully for ₹${settleModalVoucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} via ${mode}!`
      );
      setTimeout(() => setSettleToast(null), 4000);
      setSettleModalVoucher(null);
    } catch (err) {
      console.error('Failed to complete settlement:', err);
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  const totalCredits = rewardLedger
    .filter((t) => t.type === 'CREDIT_ORDER')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPlumberAllocations = rewardLedger
    .filter((t) => t.type === 'DEBIT_PLUMBER_ALLOCATION')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const issuedVouchersCount = (rewardVouchers || []).length;
  const pendingVouchersCount = (rewardVouchers || []).filter((v) => v.status === 'ISSUED').length;
  const settledVouchersCount = (rewardVouchers || []).filter((v) => v.status === 'SETTLED').length;

  const filteredVouchers = (rewardVouchers || []).filter((v) => {
    if (voucherFilter === 'PENDING' && v.status === 'SETTLED') return false;
    if (voucherFilter === 'SETTLED' && v.status !== 'SETTLED') return false;
    if (voucherSearch.trim()) {
      const q = voucherSearch.toLowerCase();
      const matchesNum = v.voucherNumber.toLowerCase().includes(q);
      const matchesDealer = (v.dealerName || '').toLowerCase().includes(q) || (v.dealerCode || '').toLowerCase().includes(q);
      const matchesPlumber = (v.plumberName || '').toLowerCase().includes(q) || (v.plumberPhone || '').toLowerCase().includes(q);
      const matchesRef = (v.paymentReference || '').toLowerCase().includes(q) || (v.creditNoteNumber || '').toLowerCase().includes(q);
      if (!matchesNum && !matchesDealer && !matchesPlumber && !matchesRef) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Rewards Policy & Settlement Ledger" />
      <DesktopSubNav />

      {/* Floating Success Toast */}
      {settleToast && (
        <div className="fixed top-16 right-5 z-50 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{settleToast}</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* Header with Live Sync Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Reward Operations, Policy & Settlement Desk</h2>
            <p className="text-xs text-[#6B7280]">
              Receive real-time vouchers from dealers & plumbers, review payment details, and complete settlements.
            </p>
          </div>
          <button
            type="button"
            onClick={() => store.syncWithDatabase(true)}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:bg-neutral-50 text-xs font-semibold text-neutral-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
            <span>Sync Live DB</span>
          </button>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Incentive Rate</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#111827] mt-1">
              {rewardConfig.ratePercent}%
            </div>
            <span className="text-[11px] text-[#6B7280]">Applied to order subtotal</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Points Generated</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 mt-1">
              ₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-800">Credited to dealers</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Plumber Allocations</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-700 mt-1">
              ₹{totalPlumberAllocations.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-blue-800">Transferred to plumbers</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Pending Settlements</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-700 mt-1 flex items-baseline gap-2">
              <span>{pendingVouchersCount}</span>
              <span className="text-xs font-normal text-neutral-500 font-sans">
                / {issuedVouchersCount} total
              </span>
            </div>
            <span className="text-[11px] text-amber-800 font-medium">Awaiting payout confirmation</span>
          </div>
        </div>

        {/* INCENTIVE POLICY CONFIGURATION */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#DC2626]" />
              <h3 className="font-mono text-xs uppercase font-bold text-[#111827]">Incentive Policy Editor</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">Live Formula Control</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Base Rate */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#111827] block">Base Reward Rate (% of Sales):</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-28 p-2 rounded-lg border border-[#D1D5DB] font-mono font-bold text-sm bg-white"
                />
                <span className="text-xs text-[#6B7280] font-mono">(Standard default: 1.0%)</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Example: On ₹1,000,000 sales, total generated reward is <strong>₹{((1000000 * rate) / 100).toLocaleString('en-IN')}</strong>.
              </p>
            </div>

            {/* Split */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#111827]">Distribution Split (Dealer vs Plumber):</label>
                <span className="font-mono text-xs font-bold text-[#DC2626]">
                  {dealerShare}% / {100 - dealerShare}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={dealerShare}
                onChange={(e) => setDealerShare(Number(e.target.value))}
                className="w-full accent-[#DC2626] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-[#6B7280]">
                <span>Dealer: {dealerShare}%</span>
                <span>Plumber Pool: {100 - dealerShare}%</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
            <span className="text-[11px] text-[#6B7280]">
              Updates apply instantly to all subsequent order submissions and calculations.
            </span>

            <button
              type="button"
              disabled={!isDirty || isSaving}
              onClick={handleSavePolicy}
              className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Update Policy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CENTRAL REWARD LEDGER & VOUCHERS */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F3F4F6] mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase font-mono tracking-tight flex items-center gap-2">
                <span>Vouchers & Settlement Desk</span>
                {pendingVouchersCount > 0 && (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                    {pendingVouchersCount} Pending Payment
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#6B7280]">
                Review incoming voucher claims from dealers and plumbers, click to complete settlement transactions.
              </p>
            </div>

            {/* Sub-Tabs: Vouchers vs Transactions */}
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveLedgerTab('VOUCHERS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeLedgerTab === 'VOUCHERS'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Claimed Vouchers</span>
                <span className="text-[10px] font-mono font-bold bg-neutral-200 px-1.5 py-0.2 rounded">
                  {issuedVouchersCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLedgerTab('TRANSACTIONS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeLedgerTab === 'TRANSACTIONS'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>Full Audit Ledger</span>
                <span className="ml-1 text-[10px] font-mono text-neutral-400">({rewardLedger.length})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: VOUCHERS TABLE & SETTLEMENT */}
          {activeLedgerTab === 'VOUCHERS' && (
            <div className="space-y-3">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2">
                <div className="flex items-center gap-1.5 bg-neutral-50 p-1 rounded-lg border border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setVoucherFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      voucherFilter === 'ALL' ? 'bg-white font-bold text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    All ({issuedVouchersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoucherFilter('PENDING')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      voucherFilter === 'PENDING' ? 'bg-white font-bold text-amber-700 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Pending Settlement ({pendingVouchersCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoucherFilter('SETTLED')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      voucherFilter === 'SETTLED' ? 'bg-white font-bold text-emerald-700 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Settled ({settledVouchersCount})</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by code, plumber, dealer, phone..."
                    value={voucherSearch}
                    onChange={(e) => setVoucherSearch(e.target.value)}
                    className="w-full sm:w-64 pl-8 pr-3 py-1.5 bg-neutral-50 border border-[#E5E7EB] rounded-lg text-xs placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                  />
                </div>
              </div>

              {/* Vouchers List */}
              <div className="divide-y divide-[#F3F4F6] border-t border-[#F3F4F6]">
                {filteredVouchers.length > 0 ? (
                  filteredVouchers.map((v) => {
                    const isDealer = v.type === 'DEALER';
                    const isSettled = v.status === 'SETTLED';
                    const phoneToDisplay = isDealer ? '' : v.plumberPhone;

                    return (
                      <div
                        key={v.id}
                        className={`py-4 px-2 sm:px-3 rounded-xl transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                          isSettled ? 'hover:bg-neutral-50/70' : 'bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100 my-1'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono font-bold shrink-0 ${
                              isDealer
                                ? 'bg-rose-100 text-[#DC2626] border border-rose-200'
                                : 'bg-blue-100 text-[#2563EB] border border-blue-200'
                            }`}
                          >
                            <span className="text-[10px] leading-none uppercase">{isDealer ? 'DLR' : 'PLMB'}</span>
                            <span className="text-xs leading-tight font-extrabold">{v.voucherNumber}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-base text-[#111827] font-mono">
                                ₹{v.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                              <span
                                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                                  isDealer
                                    ? 'bg-rose-50 text-[#DC2626] border-rose-200'
                                    : 'bg-blue-50 text-[#2563EB] border-blue-200'
                                }`}
                              >
                                {isDealer ? 'Dealer Voucher (75%)' : 'Plumber Coupon (25%)'}
                              </span>
                              <span
                                className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border flex items-center gap-1 ${
                                  isSettled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                                }`}
                              >
                                {isSettled ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Settled ({v.paymentMode || 'Credit Note'})</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                    <span>Pending Payment Settlement</span>
                                  </>
                                )}
                              </span>
                            </div>

                            <div className="text-[11px] text-[#4B5563] mt-1 flex items-center gap-x-2.5 flex-wrap">
                              <span>
                                Payee:{' '}
                                <strong className="text-neutral-900 font-semibold">
                                  {isDealer ? v.dealerName : v.plumberName}
                                </strong>
                              </span>

                              {phoneToDisplay && (
                                <>
                                  <span>•</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPhone(phoneToDisplay, v.id)}
                                    className="font-mono text-neutral-800 hover:text-black flex items-center gap-1 hover:underline cursor-pointer"
                                    title="Click to copy phone number"
                                  >
                                    <Phone className="w-3 h-3 text-neutral-500" />
                                    <span>{phoneToDisplay}</span>
                                    {copiedPhoneId === v.id ? (
                                      <span className="text-[9px] font-bold text-emerald-600">Copied!</span>
                                    ) : (
                                      <Copy className="w-2.5 h-2.5 text-neutral-400" />
                                    )}
                                  </button>
                                </>
                              )}

                              {!isDealer && (
                                <>
                                  <span>•</span>
                                  <span className="text-neutral-500">
                                    Dealer: <strong className="text-neutral-700">{v.dealerName}</strong>
                                  </span>
                                </>
                              )}

                              <span>•</span>
                              <span className="font-mono text-neutral-500">Date: {v.dateRedeemed}</span>

                              {isSettled && (v.paymentReference || v.creditNoteNumber) && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Ref: <strong>{v.paymentReference || v.creditNoteNumber}</strong>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto pt-2 md:pt-0">
                          <button
                            type="button"
                            onClick={() => setSelectedVoucherForView(v)}
                            className="px-2.5 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Ticket className="w-3.5 h-3.5 text-neutral-500" />
                            <span>View Card</span>
                          </button>

                          {!isSettled ? (
                            <button
                              type="button"
                              onClick={() => openSettlementModal(v)}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay & Settle</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openSettlementModal(v)}
                              className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Edit or review payment reference"
                            >
                              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Settled Details</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-[#6B7280] space-y-2">
                    <Ticket className="w-10 h-10 text-neutral-300 mx-auto" />
                    <p className="font-semibold text-neutral-800 text-sm">No vouchers match the selected filter</p>
                    <p className="text-[11px] text-neutral-500 max-w-md mx-auto">
                      When dealers issue plumber coupons or redeem dealer reward vouchers, they automatically stream here for payout and transaction settlement.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT LEDGER */}
          {activeLedgerTab === 'TRANSACTIONS' && (
            <div className="divide-y divide-[#F3F4F6]">
              {rewardLedger.map((tx) => {
                const isEscrow = tx.type === 'PLUMBER_REWARD_ESCROW';
                const isEscrowRelease = tx.type === 'ESCROW_RELEASE';
                const isRedeem = tx.type === 'DEALER_REDEEM_VOUCHER';
                const isCredit = tx.type === 'CREDIT_ORDER' || isEscrowRelease;

                return (
                  <div key={tx.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          isEscrow
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isEscrowRelease
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : isRedeem
                            ? 'bg-rose-50 text-[#DC2626] border border-rose-200'
                            : isCredit
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isEscrow ? (
                          <Lock className="w-4 h-4 text-amber-800" />
                        ) : isEscrowRelease ? (
                          <Unlock className="w-4 h-4 text-purple-800" />
                        ) : isRedeem ? (
                          <Ticket className="w-4 h-4 text-[#DC2626]" />
                        ) : isCredit ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 text-blue-700" />
                        )}
                      </div>

                      <div>
                        <div className="font-semibold text-[#111827] flex items-center gap-2 flex-wrap">
                          <span>{tx.description}</span>
                          {tx.voucherNumber && (
                            <span className="bg-rose-100 text-[#DC2626] font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border border-rose-200">
                              {tx.voucherNumber}
                            </span>
                          )}
                          {isEscrow && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase">
                              Escrow Held
                            </span>
                          )}
                          {isEscrowRelease && (
                            <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase">
                              Escrow Released
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-mono font-bold text-sm ${
                          isEscrow
                            ? 'text-amber-800'
                            : isEscrowRelease
                            ? 'text-purple-700'
                            : isRedeem
                            ? 'text-rose-600'
                            : tx.amount > 0
                            ? 'text-emerald-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {isEscrow
                          ? `(Escrow) ₹${tx.amount.toLocaleString('en-IN')}`
                          : isRedeem
                          ? `- ₹${Math.abs(tx.amount).toLocaleString('en-IN')}`
                          : tx.amount > 0
                          ? `+ ₹${tx.amount.toLocaleString('en-IN')}`
                          : `- ₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                      </div>
                      <span className="text-[10px] font-mono text-[#9CA3AF]">
                        {isEscrow ? `Escrow: ₹${tx.balanceAfter.toLocaleString('en-IN')}` : `Balance after: ₹${tx.balanceAfter.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />

      {/* VIEW VOUCHER VIRTUAL CARD MODAL */}
      {selectedVoucherForView && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#DC2626]" />
                <h3 className="font-bold text-sm text-[#111827]">
                  Voucher {selectedVoucherForView.voucherNumber} Coupon
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoucherForView(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <RewardVoucherCard
              voucher={selectedVoucherForView}
              onClose={() => setSelectedVoucherForView(null)}
            />
          </div>
        </div>
      )}

      {/* INTERACTIVE SETTLEMENT TRANSACTION MODAL */}
      {settleModalVoucher && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Complete Settlement Transaction
                  </h3>
                  <p className="text-[11px] text-neutral-300 font-mono">
                    Voucher: {settleModalVoucher.voucherNumber} • {settleModalVoucher.type === 'PLUMBER' ? 'Plumber Incentive' : 'Dealer Voucher'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettleModalVoucher(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmSettlement} className="p-5 space-y-4">
              {/* Highlighted Amount & Beneficiary Card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-emerald-800 block">
                    Payable Settlement Amount
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-900 mt-0.5">
                    ₹{settleModalVoucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-mono">
                    {settleModalVoucher.points} Incentive Reward Points
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-500 block">
                    Beneficiary Payee
                  </span>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {settleModalVoucher.type === 'PLUMBER' ? settleModalVoucher.plumberName : settleModalVoucher.dealerName}
                  </div>
                  {settleModalVoucher.plumberPhone && (
                    <span className="text-xs font-mono font-semibold text-neutral-600 block">
                      {settleModalVoucher.plumberPhone}
                    </span>
                  )}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-[#111827] block mb-2">
                  Select Settlement Payment Method:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Option 1: UPI */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettleMode('UPI');
                      if (settleModalVoucher.type === 'PLUMBER') {
                        setSettleNotes(`UPI / GPay transfer to ${settleModalVoucher.plumberName} (${settleModalVoucher.plumberPhone || ''})`);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      settleMode === 'UPI'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600 text-emerald-950'
                        : 'border-[#E5E7EB] hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Zap className={`w-4 h-4 ${settleMode === 'UPI' ? 'text-emerald-600' : 'text-neutral-500'}`} />
                      {settleMode === 'UPI' && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                    </div>
                    <div className="mt-2">
                      <span className="font-bold text-xs block">UPI / GPay / PhonePe</span>
                      <span className="text-[10px] text-neutral-500">Fast direct mobile transfer</span>
                    </div>
                  </button>

                  {/* Option 2: Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettleMode('BANK_TRANSFER');
                      setSettleNotes(`Bank IMPS/NEFT transfer for Voucher ${settleModalVoucher.voucherNumber}`);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      settleMode === 'BANK_TRANSFER'
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 text-blue-950'
                        : 'border-[#E5E7EB] hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Building className={`w-4 h-4 ${settleMode === 'BANK_TRANSFER' ? 'text-blue-600' : 'text-neutral-500'}`} />
                      {settleMode === 'BANK_TRANSFER' && <Check className="w-3.5 h-3.5 text-blue-700" />}
                    </div>
                    <div className="mt-2">
                      <span className="font-bold text-xs block">Bank Transfer (NEFT/IMPS)</span>
                      <span className="text-[10px] text-neutral-500">Beneficiary bank account</span>
                    </div>
                  </button>

                  {/* Option 3: Cash */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettleMode('CASH');
                      setSettleNotes(`Direct cash payment handed to ${settleModalVoucher.type === 'PLUMBER' ? settleModalVoucher.plumberName : settleModalVoucher.dealerName}`);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      settleMode === 'CASH'
                        ? 'border-amber-600 bg-amber-50/60 ring-1 ring-amber-600 text-amber-950'
                        : 'border-[#E5E7EB] hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Banknote className={`w-4 h-4 ${settleMode === 'CASH' ? 'text-amber-600' : 'text-neutral-500'}`} />
                      {settleMode === 'CASH' && <Check className="w-3.5 h-3.5 text-amber-700" />}
                    </div>
                    <div className="mt-2">
                      <span className="font-bold text-xs block">Cash Settlement</span>
                      <span className="text-[10px] text-neutral-500">Hand-to-hand physical cash</span>
                    </div>
                  </button>

                  {/* Option 4: Credit Note */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettleMode('CREDIT_NOTE');
                      setSettleRef(`CN-2026-${Math.floor(100 + Math.random() * 900)}`);
                      setSettleNotes(`Credit Note credited to dealer account ledger`);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      settleMode === 'CREDIT_NOTE'
                        ? 'border-rose-600 bg-rose-50/60 ring-1 ring-rose-600 text-rose-950'
                        : 'border-[#E5E7EB] hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <FileCheck2 className={`w-4 h-4 ${settleMode === 'CREDIT_NOTE' ? 'text-[#DC2626]' : 'text-neutral-500'}`} />
                      {settleMode === 'CREDIT_NOTE' && <Check className="w-3.5 h-3.5 text-[#DC2626]" />}
                    </div>
                    <div className="mt-2">
                      <span className="font-bold text-xs block">Credit Note Adjustment</span>
                      <span className="text-[10px] text-neutral-500">Dealer ledger balance</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Reference ID / UTR Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#111827] flex items-center justify-between">
                  <span>
                    {settleMode === 'UPI'
                      ? 'UPI Transaction Reference / UTR Number:'
                      : settleMode === 'BANK_TRANSFER'
                      ? 'Bank Transfer UTR / IMPS Ref ID:'
                      : settleMode === 'CREDIT_NOTE'
                      ? 'Credit Note Reference Number:'
                      : 'Cash Voucher / Receipt Number:'}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">Required</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    settleMode === 'UPI'
                      ? 'e.g. 426819201938 or UPI/429188'
                      : settleMode === 'BANK_TRANSFER'
                      ? 'e.g. UTR42981039841'
                      : settleMode === 'CREDIT_NOTE'
                      ? 'e.g. CN-2026-831'
                      : 'e.g. CASH-REC-001'
                  }
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#D1D5DB] text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Settled By & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#111827]">Settled By:</label>
                  <input
                    type="text"
                    value={settledBy}
                    onChange={(e) => setSettledBy(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#D1D5DB] text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#111827]">Settlement Notes:</label>
                  <input
                    type="text"
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    placeholder="Optional remarks"
                    className="w-full p-2 rounded-lg border border-[#D1D5DB] text-xs bg-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSettleModalVoucher(null)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSettle || !settleRef.trim()}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingSettle ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming Settlement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        Confirm Payment & Settle (₹{settleModalVoucher.amount.toLocaleString('en-IN')})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
