'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Phone,
  MapPin,
  CreditCard,
  Award,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { store } from '@/data/store';
import { Dealer } from '@/types';

export function EditDealerModal({
  dealer,
  isOpen,
  onClose,
  onSuccess
}: {
  dealer: Dealer | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: Dealer) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    city: '',
    state: 'Odisha',
    address: '',
    creditLimit: 500000,
    outstandingBalance: 0,
    tier: 'Gold' as 'Platinum' | 'Gold' | 'Silver'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (dealer) {
      setFormData({
        name: dealer.name || '',
        ownerName: dealer.ownerName || '',
        phone: dealer.phone || '',
        city: dealer.city || '',
        state: dealer.state || 'Odisha',
        address: dealer.address || '',
        creditLimit: dealer.creditLimit || 300000,
        outstandingBalance: dealer.outstandingBalance || 0,
        tier: dealer.tier || 'Silver'
      });
      setSuccessMessage('');
    }
  }, [dealer]);

  if (!isOpen || !dealer) return null;

  const cleanPhone = formData.phone.replace(/[^0-9]/g, '');

  const utilizationPercent =
    formData.creditLimit > 0
      ? Math.min(100, Math.round((formData.outstandingBalance / formData.creditLimit) * 100))
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.ownerName.trim() || !formData.phone.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const updated = store.updateDealer(dealer.id, {
        name: formData.name.trim(),
        ownerName: formData.ownerName.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        address: formData.address.trim(),
        creditLimit: Number(formData.creditLimit) || 300000,
        outstandingBalance: Number(formData.outstandingBalance) || 0,
        tier: formData.tier
      });

      setIsSubmitting(false);
      setSuccessMessage(`Dealer record for ${formData.name} updated successfully.`);

      setTimeout(() => {
        if (updated && onSuccess) {
          onSuccess(updated);
        }
        onClose();
      }, 700);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#111827]">Edit Dealer Account</h3>
                <span className="tech-code font-bold text-xs bg-[#111827] text-white px-2 py-0.5 rounded font-mono">
                  {dealer.code}
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Commercial credit terms, location & primary authorized contacts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-200 text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Firm Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Firm / Dealership Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Shree Balaji Sanitary & Hardware"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              />
            </div>

            {/* Owner / Contact Person */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Owner / Authorized Signatory <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="e.g. Mukesh Agarwal"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              />
            </div>

            {/* Phone & WhatsApp */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#374151]">
                  Contact Phone & WhatsApp <span className="text-rose-600">*</span>
                </label>
                {cleanPhone.length >= 10 && (
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 font-mono font-medium"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Test WA Link
                  </a>
                )}
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98980 99881"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] font-mono"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                City / Town <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Bhubaneswar"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                State / Region
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              >
                <option value="Odisha">Odisha</option>
                <option value="Gujarat">Gujarat</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Chhattisgarh">Chhattisgarh</option>
                <option value="Jharkhand">Jharkhand</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>

            {/* Full Street Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Full Physical Address / Depot Delivery Point
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Shop number, market complex, landmark, pin code..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              />
            </div>

            {/* Dealer Tier */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Commercial Tier
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={formData.tier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tier: e.target.value as 'Platinum' | 'Gold' | 'Silver'
                    })
                  }
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                >
                  <option value="Platinum">Platinum Partner (High Volume)</option>
                  <option value="Gold">Gold Partner (Standard Commercial)</option>
                  <option value="Silver">Silver Partner (New / Developing)</option>
                </select>
              </div>
            </div>

            {/* Credit Limit */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Approved Credit Limit (₹ INR) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="font-mono text-xs text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="25000"
                  required
                  value={formData.creditLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, creditLimit: Number(e.target.value) })
                  }
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] font-mono"
                />
              </div>
            </div>

            {/* Outstanding Balance */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                Current Ledger Balance (₹ INR)
              </label>
              <div className="relative">
                <span className="font-mono text-xs text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={formData.outstandingBalance}
                  onChange={(e) =>
                    setFormData({ ...formData, outstandingBalance: Number(e.target.value) })
                  }
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626] font-mono"
                />
              </div>
            </div>

            {/* Credit Utilization Preview Card */}
            <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#6B7280]">Credit Utilization:</span>
                <span
                  className={`font-mono font-bold ${
                    utilizationPercent > 80 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {utilizationPercent}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    utilizationPercent > 80 ? 'bg-rose-600' : 'bg-neutral-900'
                  }`}
                  style={{ width: `${utilizationPercent}%` }}
                />
              </div>
              {utilizationPercent > 80 && (
                <div className="flex items-center gap-1 text-[10px] text-rose-600 mt-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Approaching credit threshold</span>
                </div>
              )}
            </div>
          </div>

          {/* Audit Trail Note */}
          <div className="bg-neutral-50 p-3 rounded-lg border border-[#E5E7EB] flex items-center gap-2 text-[11px] text-[#6B7280]">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Updating dealer parameters updates the ERP ledger mapping and dispatches automated updates for new field orders.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#4B5563] hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#111827] hover:bg-black disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSubmitting ? 'Saving...' : 'Save Dealer Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
