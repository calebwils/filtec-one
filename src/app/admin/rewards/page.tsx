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
  Check
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

  const handleSettleVoucher = (voucherId: string) => {
    const cnNumber = `CN-2026-${Math.floor(100 + Math.random() * 900)}`;
    store.settleVoucher(voucherId, cnNumber);
  };

  const totalCredits = rewardLedger
    .filter((t) => t.type === 'CREDIT_ORDER')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPlumberAllocations = rewardLedger
    .filter((t) => t.type === 'DEBIT_PLUMBER_ALLOCATION')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const totalPlumberEscrow = dealers.reduce((acc, d) => acc + (d.pendingPlumberRewards || 0), 0);

  const issuedVouchersCount = (rewardVouchers || []).length;
  const pendingVouchersCount = (rewardVouchers || []).filter((v) => v.status === 'ISSUED').length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Rewards Policy & Ledger" />
      <DesktopSubNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Reward Rate Configuration & Ledger</h2>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Active Sales Incentive</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#111827] mt-1">
              {rewardConfig.ratePercent}%
            </div>
            <span className="text-[11px] text-[#6B7280]">Applied to order subtotal</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Total Points Generated</span>
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
            <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Vouchers Claimed</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 mt-1 flex items-baseline gap-2">
              <span>{issuedVouchersCount}</span>
              {pendingVouchersCount > 0 && (
                <span className="text-xs font-semibold text-amber-700 font-sans">
                  ({pendingVouchersCount} pending)
                </span>
              )}
            </div>
            <span className="text-[11px] text-neutral-600">Credit Notes & Coupons</span>
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
                Example: On ₹1,000,000 sales, total generated reward is <strong>₹{(1000000 * rate) / 100}</strong>.
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F3F4F6] mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase font-mono tracking-tight">
                Reward Operations & Voucher Settlement
              </h3>
              <p className="text-xs text-[#6B7280]">
                Manage official dealer vouchers (D-xxx), plumber coupons (P-xxx), and credit notes
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
            <div className="divide-y divide-[#F3F4F6]">
              {issuedVouchersCount > 0 ? (
                rewardVouchers.map((v) => {
                  const isDealer = v.type === 'DEALER';
                  const isSettled = v.status === 'SETTLED';

                  return (
                    <div key={v.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start sm:items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                            isDealer
                              ? 'bg-rose-100 text-[#DC2626] border border-rose-200'
                              : 'bg-blue-100 text-[#2563EB] border border-blue-200'
                          }`}
                        >
                          {v.voucherNumber}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#111827]">
                              ₹{v.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase border ${
                                isDealer
                                  ? 'bg-rose-50 text-[#DC2626] border-rose-200'
                                  : 'bg-blue-50 text-[#2563EB] border-blue-200'
                              }`}
                            >
                              {isDealer ? 'Dealer Voucher' : 'Plumber Coupon'}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold border ${
                                isSettled
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {isSettled ? 'Credit Note Settled' : 'Pending Settlement'}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-x-2 flex-wrap">
                            <span>
                              Beneficiary:{' '}
                              <strong className="text-neutral-900">
                                {isDealer ? v.dealerName : `${v.plumberName} (via ${v.dealerName})`}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="font-mono">Date: {v.dateRedeemed}</span>
                            {v.creditNoteNumber && (
                              <>
                                <span>•</span>
                                <span className="font-mono font-bold text-emerald-700">
                                  {v.creditNoteNumber}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedVoucherForView(v)}
                          className="px-2.5 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-semibold text-xs transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Ticket className="w-3.5 h-3.5 text-neutral-500" />
                          <span>View Coupon</span>
                        </button>

                        {!isSettled ? (
                          <button
                            type="button"
                            onClick={() => handleSettleVoucher(v.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Issue Credit Note</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Settled</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-[#6B7280] space-y-2">
                  <Ticket className="w-8 h-8 text-neutral-300 mx-auto" />
                  <p>No reward vouchers have been claimed by dealers yet.</p>
                  <p className="text-[11px] text-neutral-500">
                    When dealers redeem points on their portal, vouchers (D-001, etc.) appear here for Credit Note issuance.
                  </p>
                </div>
              )}
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

      {/* View Voucher Modal */}
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
    </div>
  );
}
