'use client';

import React from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore } from '@/data/store';
import { Award, ArrowUpRight, ArrowDownLeft, Users, ArrowRight } from 'lucide-react';

export default function DealerRewardsPage() {
  const { rewardLedger, currentUser, dealers } = useAppStore();
  const currentDealer = dealers.find((d) => d.id === currentUser.dealerId) || dealers[0];

  const dealerLedger = rewardLedger.filter((t) => t.dealerId === currentDealer.id);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Reward Ledger" subtitle={currentDealer.name} />
      <DesktopSubNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Ledger Balance Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F3F4F6]">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-[#DC2626] tracking-wider">
                TRANSPARENT REWARD LEDGER
              </span>
              <h2 className="text-xl font-bold text-[#111827] mt-0.5">
                Commercial Incentive Account
              </h2>
              <p className="text-xs text-[#6B7280]">
                1% of order value credited upon central authorization; transferrable to plumbers
              </p>
            </div>

            <Link
              href="/dealer/plumbers"
              className="inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Allocate to Plumbers</span>
            </Link>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">
                Current Available Balance
              </span>
              <div className="text-3xl font-bold font-mono text-emerald-700 mt-1">
                ₹{currentDealer.availableRewards.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-xs text-[#6B7280] font-mono">
              Account: {currentDealer.code} • {currentDealer.tier} Tier
            </div>
          </div>
        </div>

        {/* Full Ledger Entries (Section 22) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
            <h3 className="text-xs font-bold uppercase font-mono text-[#111827]">
              Reward Transaction History
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">
              {dealerLedger.length} Records
            </span>
          </div>

          <div className="divide-y divide-[#F3F4F6]">
            {dealerLedger.length > 0 ? (
              dealerLedger.map((tx) => (
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
                        {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono font-bold text-sm ${
                        tx.amount > 0 ? 'text-emerald-700' : 'text-blue-700'
                      }`}
                    >
                      {tx.amount > 0
                        ? `+ ₹${tx.amount.toLocaleString('en-IN')}`
                        : `- ₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                    </div>
                    <span className="text-[10px] font-mono text-[#9CA3AF]">
                      Balance: ₹{tx.balanceAfter.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-[#6B7280]">
                No reward transactions recorded yet.
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
