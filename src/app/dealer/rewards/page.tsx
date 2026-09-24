'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore } from '@/data/store';
import { DealerRedeemModal } from '@/components/rewards/DealerRedeemModal';
import { RewardVoucherCard } from '@/components/rewards/RewardVoucherCard';
import { RewardVoucher } from '@/types';
import {
  Award,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  ArrowRight,
  Lock,
  Unlock,
  ShieldCheck,
  Ticket,
  Printer,
  X,
  FileCheck2,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function DealerRewardsPage() {
  const { rewardLedger, rewardVouchers, currentUser, dealers, plumbers } = useAppStore();
  const currentDealer = dealers.find((d) => d.id === currentUser.dealerId || d.code === currentUser.dealerId) || dealers[0];

  const dealerLedger = rewardLedger.filter((t) => t.dealerId === currentDealer.id || t.dealerId === currentDealer.code);
  const dealerPlumbers = plumbers.filter((p) => p.dealerId === currentDealer.id || p.dealerName === currentDealer.name);
  const totalAllocatedToPlumbers = dealerPlumbers.reduce((s, p) => s + (p.totalAllocatedRewards || 0), 0);
  const pendingPlumberRewards = currentDealer.pendingPlumberRewards || 0;
  const totalPlumberRewards = Number((totalAllocatedToPlumbers + pendingPlumberRewards).toFixed(2));

  // Vouchers belonging to this dealer (Dealer redemptions D-001 or Plumber vouchers P-001 issued by this dealer)
  const dealerVouchers = (rewardVouchers || []).filter(
    (v) => v.dealerId === currentDealer.id || v.dealerId === currentDealer.code || v.dealerName === currentDealer.name
  );

  // Modal States
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<RewardVoucher | null>(null);
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'VOUCHERS'>('TRANSACTIONS');

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Reward Ledger" subtitle={currentDealer.name} />
      <DesktopSubNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Ledger Header & Allocation Link */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F3F4F6]">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-[#DC2626] tracking-wider">
                TRANSPARENT REWARD LEDGER
              </span>
              <h2 className="text-xl font-bold text-[#111827] mt-0.5">
                Commercial Incentive Architecture
              </h2>
              <p className="text-xs text-[#6B7280]">
                1% of total order value split between Dealer (75%) and Plumber (25%). Strictly separated pools.
              </p>
            </div>

            <Link
              href="/dealer/plumbers"
              className="inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manage Plumbers</span>
            </Link>
          </div>

          {/* Two-Column Account Balances: Dealer 75% vs Plumber 25% */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account 1: Dealer Reward Account (75% Share) */}
            <div className="bg-[#F9FAFB] p-4 sm:p-5 rounded-xl border border-[#E5E7EB] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-[#6B7280] font-bold block">
                    Dealer Available Balance
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Dealer 75% Share
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 mt-1">
                  ₹{currentDealer.availableRewards.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  75% of 1% total order value credited to dealer profit account.
                </p>
              </div>

              {/* Redeem / Claim Voucher Button */}
              <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between gap-2">
                <span className="text-[11px] text-neutral-500 font-medium">
                  Settle as Credit Note
                </span>
                <button
                  type="button"
                  onClick={() => setIsRedeemModalOpen(true)}
                  disabled={currentDealer.availableRewards <= 0}
                  className="inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Redeem Points</span>
                </button>
              </div>
            </div>

            {/* Account 2: Plumber Reward Pool (25% Share based on 1% total order value) */}
            <div className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between ${pendingPlumberRewards > 0 ? 'bg-amber-50/80 border-amber-300' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-[#6B7280] font-bold block">
                    Plumber Reward Pool
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Plumber 25% Share
                  </span>
                </div>
                <div className={`text-2xl sm:text-3xl font-bold font-mono mt-1 ${pendingPlumberRewards > 0 ? 'text-amber-900' : 'text-blue-700'}`}>
                  ₹{totalPlumberRewards.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-1 text-[11px] text-[#6B7280]">
                  <span>
                    {pendingPlumberRewards > 0
                      ? `₹${pendingPlumberRewards.toFixed(2)} held in escrow • ₹${totalAllocatedToPlumbers.toFixed(2)} to plumbers`
                      : `25% of 1% total order value (100% credited to registered plumbers)`}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200/80 flex items-center justify-between gap-2">
                <div className="text-[11px] text-neutral-500">
                  {dealerPlumbers.length} Plumbers Linked
                </div>
                <Link
                  href="/dealer/plumbers"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  <span>Allocate Points</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* History / Vouchers Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('TRANSACTIONS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'TRANSACTIONS'
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <span>Reward Transactions</span>
                <span className="ml-1.5 text-[10px] font-mono opacity-80">({dealerLedger.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('VOUCHERS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'VOUCHERS'
                    ? 'bg-[#DC2626] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Issued Vouchers</span>
                <span className="ml-0.5 text-[10px] font-mono opacity-90">({dealerVouchers.length})</span>
              </button>
            </div>

            {activeTab === 'VOUCHERS' && (
              <button
                type="button"
                onClick={() => setIsRedeemModalOpen(true)}
                disabled={currentDealer.availableRewards <= 0}
                className="text-xs font-semibold text-[#DC2626] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <span>+ Redeem New</span>
              </button>
            )}
          </div>

          {/* TAB 1: ALL LEDGER TRANSACTIONS */}
          {activeTab === 'TRANSACTIONS' && (
            <div className="divide-y divide-[#F3F4F6]">
              {dealerLedger.length > 0 ? (
                dealerLedger.map((tx) => {
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
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
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
                            <Unlock className="w-4 h-4 text-purple-700" />
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
                              <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase">
                                Escrow Held
                              </span>
                            )}
                            {isEscrowRelease && (
                              <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase">
                                Escrow Unlocked
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
                          {isEscrow ? `Escrow: ₹${tx.balanceAfter.toLocaleString('en-IN')}` : `Balance: ₹${tx.balanceAfter.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-[#6B7280]">
                  No reward transactions recorded yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VOUCHERS LIST */}
          {activeTab === 'VOUCHERS' && (
            <div className="divide-y divide-[#F3F4F6]">
              {dealerVouchers.length > 0 ? (
                dealerVouchers.map((v) => {
                  const isDealerVoucher = v.type === 'DEALER';
                  return (
                    <div key={v.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                            isDealerVoucher
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
                                isDealerVoucher
                                  ? 'bg-rose-50 text-[#DC2626] border-rose-200'
                                  : 'bg-blue-50 text-[#2563EB] border-blue-200'
                              }`}
                            >
                              {isDealerVoucher ? 'Dealer Coupon' : `Plumber: ${v.plumberName}`}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold border ${
                                v.status === 'SETTLED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {v.status === 'SETTLED' ? 'Credit Note Settled' : 'Issued (Pending)'}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#6B7280] font-mono mt-0.5 flex items-center gap-2">
                            <span>Date of Redeem: {v.dateRedeemed}</span>
                            {v.creditNoteNumber && (
                              <span className="text-emerald-700 font-bold">• {v.creditNoteNumber}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedVoucherForView(v)}
                        className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                      >
                        <Ticket className="w-3.5 h-3.5 text-neutral-500" />
                        <span>View Coupon</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-[#6B7280] space-y-2">
                  <Ticket className="w-8 h-8 text-neutral-300 mx-auto" />
                  <p>No vouchers have been claimed yet.</p>
                  <p className="text-[11px] text-neutral-500">
                    Click <strong>Redeem Points</strong> above to generate your first official credit voucher!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />

      {/* Dealer Redeem Modal */}
      <DealerRedeemModal
        dealer={currentDealer}
        isOpen={isRedeemModalOpen}
        onClose={() => setIsRedeemModalOpen(false)}
      />

      {/* Voucher Detail Modal */}
      {selectedVoucherForView && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#DC2626]" />
                <h3 className="font-bold text-sm text-[#111827]">
                  Voucher {selectedVoucherForView.voucherNumber} Details
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
