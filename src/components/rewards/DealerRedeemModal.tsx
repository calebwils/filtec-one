'use client';

import React, { useState } from 'react';
import { Dealer, RewardVoucher } from '@/types';
import { store, useAppStore } from '@/data/store';
import { RewardVoucherCard } from './RewardVoucherCard';
import {
  Award,
  Calendar,
  CheckCircle2,
  FileCheck2,
  Phone,
  Sparkles,
  Ticket,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DealerRedeemModalProps {
  dealer: Dealer;
  isOpen: boolean;
  onClose: () => void;
}

export function DealerRedeemModal({ dealer, isOpen, onClose }: DealerRedeemModalProps) {
  const { rewardVouchers } = useAppStore();

  const [pointsToRedeem, setPointsToRedeem] = useState<number>(() => {
    return Math.floor(dealer.availableRewards) || dealer.availableRewards || 0;
  });
  const [createdVoucher, setCreatedVoucher] = useState<RewardVoucher | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const nextSeq = (rewardVouchers || []).filter((v) => v.type === 'DEALER').length + 1;
  const previewVoucherNumber = `D-${String(nextSeq).padStart(3, '0')}`;

  const now = new Date();
  const todayFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (pointsToRedeem <= 0 || pointsToRedeem > dealer.availableRewards) return;

    setIsSubmitting(true);
    try {
      const voucher = store.redeemDealerReward(dealer.id, pointsToRedeem);
      if (voucher) {
        setCreatedVoucher(voucher);
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch (err) {}
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCreatedVoucher(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827]">
                {createdVoucher ? 'Voucher Generated Successfully' : 'Redeem Reward Points'}
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                {createdVoucher ? 'Download or print your official coupon' : `${dealer.name} • Profit Incentive Balance`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View 1: If Voucher has just been generated */}
        {createdVoucher ? (
          <div className="space-y-3">
            {/* The Voucher Card */}
            <RewardVoucherCard voucher={createdVoucher} onClose={handleClose} />
          </div>
        ) : (
          /* View 2: Redeem Form */
          <form onSubmit={handleRedeem} className="space-y-4 text-xs">
            {/* Balance & Preview Banner */}
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block">
                    CURRENT AVAILABLE BALANCE
                  </span>
                  <div className="text-2xl font-mono font-bold text-emerald-700 mt-0.5">
                    ₹{dealer.availableRewards.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block">
                    VOUCHER NUMBER PREVIEW
                  </span>
                  <div className="text-lg font-mono font-bold text-[#DC2626] mt-0.5">
                    {previewVoucherNumber}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200/80 flex items-center justify-between text-[11px] text-neutral-600 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Date of Redeem: {todayFormatted}</span>
                </span>
                <span>Type: Dealer 75% Pool</span>
              </div>
            </div>

            {/* Input Points */}
            <div>
              <label className="font-semibold text-[#111827] block mb-1">
                Amount to Redeem (₹):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-neutral-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max={dealer.availableRewards}
                  step="any"
                  required
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-[#D1D5DB] bg-white text-sm font-mono font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>

              {/* Quick preset buttons */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPointsToRedeem(dealer.availableRewards)}
                  className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-[#DC2626] font-mono font-semibold text-[11px] border border-rose-200 cursor-pointer"
                >
                  Full Balance (₹{dealer.availableRewards.toFixed(2)})
                </button>
                {[50, 100, 500, 1000].map((preset) => {
                  if (preset > dealer.availableRewards) return null;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPointsToRedeem(preset)}
                      className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-mono text-[11px] border border-neutral-200 cursor-pointer"
                    >
                      ₹{preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 leading-relaxed">
              <p>
                <strong>How it works:</strong> Upon clicking Confirm, official voucher{' '}
                <strong className="font-mono text-neutral-900">{previewVoucherNumber}</strong> will be generated. You can download the coupon or give it to your FILTEC Marketing Representative to have Finance settle it directly onto your billing account.
              </p>
            </div>

            {/* Submit & Cancel */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-300 text-neutral-700 font-semibold text-xs hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || pointsToRedeem <= 0 || pointsToRedeem > dealer.availableRewards}
                className="flex-2 py-2.5 px-4 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate Voucher & Claim</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
