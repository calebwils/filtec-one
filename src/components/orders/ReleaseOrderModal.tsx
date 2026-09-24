'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/types';
import { useAppStore, store } from '@/data/store';
import {
  FileText,
  Calendar,
  IndianRupee,
  Users,
  Building2,
  CheckCircle2,
  X,
  Calculator,
  ArrowRight,
  Lock,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function ReleaseOrderModal({
  order,
  isOpen,
  onClose
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { rewardConfig, plumbers } = useAppStore();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceValue, setInvoiceValue] = useState<string>('');
  const [selectedPlumberId, setSelectedPlumberId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form when order changes or opens
  useEffect(() => {
    if (order && isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const defaultInv = order.invoiceNumber || '';
      setInvoiceNumber(defaultInv);
      setInvoiceDate(order.invoiceDate || today);
      setInvoiceValue(String(order.invoiceValue || order.totalAmount || ''));
      setError(null);

      // Find if dealer has registered plumbers
      const dealerPlumbers = plumbers.filter(
        (p) => (p.dealerId === order.dealerId || p.dealerName === order.dealerName) && p.status === 'ACTIVE'
      );
      if (dealerPlumbers.length > 0) {
        setSelectedPlumberId(dealerPlumbers[0].id);
      } else {
        setSelectedPlumberId('');
      }
    }
  }, [order, isOpen, plumbers]);

  if (!isOpen || !order) return null;

  // Plumbers for this dealer
  const dealerPlumbers = plumbers.filter(
    (p) => (p.dealerId === order.dealerId || p.dealerName === order.dealerName) && p.status === 'ACTIVE'
  );

  // Live calculation of 1% reward based strictly on invoice value
  const numericInvoiceValue = Math.max(0, parseFloat(invoiceValue) || 0);
  const ratePercent = rewardConfig.ratePercent || 1.0;
  const dealerSharePercent = rewardConfig.dealerSharePercent ?? 75;
  const plumberSharePercent = rewardConfig.plumberSharePercent ?? 25;

  const totalReward = Number(((numericInvoiceValue * ratePercent) / 100).toFixed(2));
  const dealerReward = Number(((totalReward * dealerSharePercent) / 100).toFixed(2));
  const plumberReward = Number(((totalReward * plumberSharePercent) / 100).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      setError('Please enter a valid invoice number.');
      return;
    }
    if (!invoiceDate) {
      setError('Please enter a valid invoice date.');
      return;
    }
    if (numericInvoiceValue <= 0) {
      setError('Please enter a positive invoice value (₹).');
      return;
    }

    setIsSubmitting(true);
    try {
      store.releaseOrder(order.id, {
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        invoiceValue: numericInvoiceValue,
        plumberId: selectedPlumberId || undefined
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {
        // ignore confetti errors in headless environments
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to release order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5 text-neutral-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                Release Order & Invoice
              </h2>
              <div className="text-xs text-[#6B7280] font-mono flex items-center gap-1.5 mt-0.5">
                <span>{order.orderNumber}</span>
                <span>•</span>
                <span className="text-[#111827] font-medium">{order.dealerName}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Number & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Invoice Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter Invoice Number manually (e.g. INV-2026-001)"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-medium rounded-lg border border-[#E5E7EB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Invoice Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-medium rounded-lg border border-[#E5E7EB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Invoice Value */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#111827]">
                Invoice Value (₹ INR) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-neutral-500 font-mono">
                Order Value: ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs font-bold pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={invoiceValue}
                onChange={(e) => setInvoiceValue(e.target.value)}
                placeholder="Enter final invoice amount"
                className="w-full pl-8 pr-3 py-2.5 text-sm font-mono font-bold rounded-lg border border-[#E5E7EB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <p className="text-[10px] text-[#6B7280] mt-1">
              The 1% reward will automatically be calculated based on this invoice value only.
            </p>
          </div>

          {/* Plumber Allocation Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#111827]">
                Plumber Reward Allocation ({plumberSharePercent}% Share)
              </label>
              {dealerPlumbers.length === 0 && (
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Escrow Protection Active</span>
                </span>
              )}
            </div>

            <div className="relative">
              <Users className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedPlumberId}
                onChange={(e) => setSelectedPlumberId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white text-[#111827] focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer"
              >
                {dealerPlumbers.length > 0 ? (
                  <>
                    {dealerPlumbers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.phone}) — Currently Earned: ₹{p.totalAllocatedRewards.toLocaleString('en-IN')}
                      </option>
                    ))}
                    <option value="">Dealer Plumber Pool (Unassigned)</option>
                  </>
                ) : (
                  <option value="">🔒 Held in Plumber Escrow (No registered plumber on file)</option>
                )}
              </select>
            </div>

            {dealerPlumbers.length === 0 && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <strong className="font-semibold text-amber-950">Plumber Escrow Protection:</strong> This dealer does not currently have an onboarded plumber. The plumber reward (<strong>₹{plumberReward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>) will <strong>stay in escrow and NEVER go to the dealer</strong> until they onboard a new plumber.
                </div>
              </div>
            )}
          </div>

          {/* Live Automatic Reward Calculation Card */}
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#111827] pb-2 border-b border-neutral-200">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-neutral-600" />
                <span>Automatic 1% Reward Calculation</span>
              </div>
              <span className="font-mono text-[11px] text-neutral-500">
                Rate: {ratePercent}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-neutral-200/80 shadow-2xs">
                <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Total Reward</span>
                <div className="text-sm font-bold font-mono text-[#111827] mt-0.5">
                  ₹{totalReward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[9px] text-[#6B7280]">1.0% of Invoice</span>
              </div>

              <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-200/80 shadow-2xs">
                <span className="text-[10px] uppercase font-mono text-emerald-700 block">Dealer Share</span>
                <div className="text-sm font-bold font-mono text-emerald-950 mt-0.5">
                  ₹{dealerReward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[9px] text-emerald-700 font-medium">{dealerSharePercent}% Split</span>
              </div>

              <div className="bg-blue-50/40 p-2.5 rounded-lg border border-blue-200/80 shadow-2xs">
                <span className="text-[10px] uppercase font-mono text-blue-700 block">Plumber Share</span>
                <div className="text-sm font-bold font-mono text-blue-950 mt-0.5">
                  ₹{plumberReward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[9px] text-blue-700 font-medium">{plumberSharePercent}% Split</span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numericInvoiceValue <= 0}
              className="px-4 py-2 text-xs font-semibold bg-[#111827] hover:bg-black text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-300" />
              <span>{isSubmitting ? 'Processing...' : 'Save & Release Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
