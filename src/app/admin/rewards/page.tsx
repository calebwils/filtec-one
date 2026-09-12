'use client';

import React, { useState } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore, store } from '@/data/store';
import { Award, Sliders, CheckCircle2, RefreshCw, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';

export default function AdminRewardsPage() {
  const { rewardConfig, rewardLedger } = useAppStore();

  const [rate, setRate] = useState(rewardConfig.ratePercent);
  const [dealerShare, setDealerShare] = useState(rewardConfig.dealerSharePercent);
  const [isSaved, setIsSaved] = useState(false);

  const plumberShare = 100 - dealerShare;

  const handleSaveConfig = () => {
    store.updateRewardConfig({
      ratePercent: Number(rate),
      dealerSharePercent: Number(dealerShare),
      plumberSharePercent: Number(plumberShare)
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const totalCredits = rewardLedger
    .filter((t) => t.type === 'CREDIT_ORDER')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPlumberAllocations = Math.abs(
    rewardLedger
      .filter((t) => t.type === 'DEBIT_PLUMBER_ALLOCATION')
      .reduce((acc, t) => acc + t.amount, 0)
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Rewards Policy & Ledger" subtitle="Commercial Incentive Architecture" />
      <DesktopSubNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Reward Rate Configuration & Ledger</h2>
          <p className="text-xs text-[#6B7280]">
            Dynamic incentive rate calculation and transparent multi-tier distribution policy
          </p>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Active Sales Incentive</span>
            <div className="text-2xl font-bold font-mono text-[#111827] mt-1">
              {rewardConfig.ratePercent}%
            </div>
            <span className="text-[11px] text-[#6B7280]">Applied to eligible order subtotal</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Total Points Generated</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
              ₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-800">Credited to dealer ledger</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Plumber Allocations</span>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
              ₹{totalPlumberAllocations.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-blue-800">Transferred by dealers to plumbers</span>
          </div>
        </div>

        {/* CONFIGURATION PANEL (Brief Section 20 & 21: Never hard-code rates!) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#DC2626]" />
              <h3 className="text-sm font-bold text-[#111827] uppercase font-mono tracking-tight">
                Incentive Policy Editor
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">Live Formula Control</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Rate percentage input */}
            <div>
              <label className="text-xs font-semibold text-[#111827] block mb-1">
                Base Reward Rate (% of Sales):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10.0"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value) || 1.0)}
                  className="w-32 text-sm p-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] font-mono font-bold text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
                <span className="text-xs text-[#6B7280]">
                  (Standard default: <strong>1.0%</strong>)
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] mt-1.5">
                Example: On ₹1,000,000 sales, total generated reward is <strong>₹{(1000000 * rate / 100).toLocaleString('en-IN')}</strong>.
              </p>
            </div>

            {/* Distribution split slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#111827]">
                  Distribution Split (Dealer vs Plumber):
                </label>
                <span className="font-mono text-xs font-bold text-[#111827]">
                  {dealerShare}% / {plumberShare}%
                </span>
              </div>

              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={dealerShare}
                onChange={(e) => setDealerShare(parseInt(e.target.value))}
                className="w-full accent-[#DC2626]"
              />

              <div className="flex justify-between text-[11px] font-mono text-[#6B7280] mt-1">
                <span>Dealer: <strong>{dealerShare}%</strong></span>
                <span>Plumber Pool: <strong>{plumberShare}%</strong></span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
            <div className="text-xs text-[#6B7280]">
              Updates apply instantly to all subsequent order submissions and calculations.
            </div>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Configuration Saved!</span>
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

        {/* CENTRAL REWARD LEDGER (Brief Section 22) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827] uppercase font-mono tracking-tight">
                Central Reward Activity Ledger
              </h3>
              <p className="text-xs text-[#6B7280]">Full audit trail of sales incentives and plumber disbursements</p>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">Immutable Records</span>
          </div>

          <div className="divide-y divide-[#F3F4F6]">
            {rewardLedger.map((tx) => (
              <div key={tx.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      tx.type === 'CREDIT_ORDER'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {tx.type === 'CREDIT_ORDER' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-[#111827]">{tx.description}</div>
                    <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-mono font-bold text-sm ${
                      tx.amount > 0 ? 'text-emerald-700' : 'text-blue-700'
                    }`}
                  >
                    {tx.amount > 0 ? `+ ₹${tx.amount.toLocaleString('en-IN')}` : `- ₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                  </div>
                  <span className="text-[10px] font-mono text-[#9CA3AF]">
                    Balance after: ₹{tx.balanceAfter.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
