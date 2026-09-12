'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore, store } from '@/data/store';
import {
  Building2,
  MapPin,
  Phone,
  Search,
  Award,
  CreditCard,
  Pencil,
  AlertTriangle,
  PlusCircle,
  Users,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { EditDealerModal } from '@/components/admin/EditDealerModal';
import { Dealer } from '@/types';

export default function AdminDealersPage() {
  const { dealers } = useAppStore();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'Platinum' | 'Gold' | 'Silver' | 'RISK'>('ALL');
  const [selectedDealerForEdit, setSelectedDealerForEdit] = useState<Dealer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

  // New Dealer state for simple onboard modal
  const [newDealerData, setNewDealerData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    city: '',
    state: 'Odisha',
    address: '',
    creditLimit: 300000,
    tier: 'Gold' as 'Platinum' | 'Gold' | 'Silver'
  });

  const totalOutstanding = dealers.reduce((sum, d) => sum + (d.outstandingBalance || 0), 0);
  const totalCreditLimit = dealers.reduce((sum, d) => sum + (d.creditLimit || 0), 0);
  const totalPlumbers = dealers.reduce((sum, d) => sum + (d.plumbersCount || 0), 0);

  const filteredDealers = dealers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase()) ||
      d.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (tierFilter === 'ALL') return true;
    if (tierFilter === 'RISK') {
      const util = d.creditLimit > 0 ? (d.outstandingBalance / d.creditLimit) * 100 : 0;
      return util >= 80;
    }
    return d.tier === tierFilter;
  });

  const handleCreateDealer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealerData.name || !newDealerData.ownerName || !newDealerData.phone) return;

    store.onboardDealer({
      name: newDealerData.name,
      ownerName: newDealerData.ownerName,
      phone: newDealerData.phone,
      city: newDealerData.city || 'Bhubaneswar',
      state: newDealerData.state || 'Odisha',
      address: newDealerData.address || 'Commercial Market',
      creditLimit: Number(newDealerData.creditLimit) || 300000,
      tier: newDealerData.tier
    });

    setIsOnboardModalOpen(false);
    setNewDealerData({
      name: '',
      ownerName: '',
      phone: '',
      city: '',
      state: 'Odisha',
      address: '',
      creditLimit: 300000,
      tier: 'Gold'
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Dealer Directory" subtitle="Commercial Accounts & Credit Master" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Authorized Dealer Network</h2>
            <p className="text-xs text-[#6B7280]">
              Credit exposure, outstanding balances, commercial tiers, and master profile administration
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOnboardModalOpen(true)}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Onboard Dealer</span>
            </button>
          </div>
        </div>

        {/* Financial & Network KPI Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
              <span className="font-mono uppercase font-semibold text-[10px]">Active Dealers</span>
              <Building2 className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-xl font-bold font-mono text-[#111827]">{dealers.length} Accounts</div>
            <span className="text-[10px] text-emerald-700 font-medium">100% Authorized Network</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
              <span className="font-mono uppercase font-semibold text-[10px]">Total Ledger Outstanding</span>
              <CreditCard className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-800">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">
              Limit: ₹{totalCreditLimit.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
              <span className="font-mono uppercase font-semibold text-[10px]">Credit Utilization</span>
              <AlertTriangle className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-xl font-bold font-mono text-[#111827]">
              {totalCreditLimit > 0 ? Math.round((totalOutstanding / totalCreditLimit) * 100) : 0}%
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">Safe Operational Ceiling</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
              <span className="font-mono uppercase font-semibold text-[10px]">Linked Plumbers</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-800">{totalPlumbers} Plumbers</div>
            <span className="text-[10px] text-neutral-500 font-medium">Generating Secondary Sales</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by dealer firm, owner, city, ID..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {(['ALL', 'Platinum', 'Gold', 'Silver', 'RISK'] as const).map((filter) => {
              const isSelected = tierFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTierFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-neutral-50'
                  }`}
                >
                  {filter === 'ALL'
                    ? 'All Tiers'
                    : filter === 'RISK'
                    ? 'Credit Risk (>80%)'
                    : `${filter} Tier`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dealer Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F3F4F6] flex items-center justify-between bg-[#F9FAFB]">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#111827]">
                Commercial Dealer Master Roster
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Official master accounts synchronized with billing and dispatch
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
              {filteredDealers.length} of {dealers.length} Accounts Shown
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] uppercase font-mono text-[10px]">
                  <th className="py-3 px-3">Code & Tier</th>
                  <th className="py-3 px-4">Dealership / Firm</th>
                  <th className="py-3 px-4">Location & Address</th>
                  <th className="py-3 px-4">Authorized Contact</th>
                  <th className="py-3 px-3">Outstanding / Credit Limit</th>
                  <th className="py-3 px-3">Purchases</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filteredDealers.map((dealer) => {
                  const creditUtilization = Math.min(
                    100,
                    Math.round((dealer.outstandingBalance / dealer.creditLimit) * 100)
                  );
                  const cleanPhone = dealer.phone.replace(/[^0-9]/g, '');

                  return (
                    <tr key={dealer.id} className="hover:bg-neutral-50/80 transition-colors group">
                      {/* Code & Tier */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="tech-code font-bold text-xs bg-[#111827] text-white px-2 py-0.5 rounded font-mono">
                          {dealer.code}
                        </span>
                        <div className="mt-1">
                          <span
                            className={`inline-flex text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                              dealer.tier === 'Platinum'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : dealer.tier === 'Gold'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                            }`}
                          >
                            {dealer.tier}
                          </span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-[#111827]">{dealer.name}</div>
                        <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                          {dealer.plumbersCount} Linked Plumber(s)
                        </div>
                      </td>

                      {/* Location & Address */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-1 text-neutral-700">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-[#111827]">
                              {dealer.city}, {dealer.state}
                            </span>
                            <p className="text-[11px] text-[#6B7280] line-clamp-1">{dealer.address}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Owner */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-[#111827]">{dealer.ownerName}</div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#4B5563] mt-0.5">
                          <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                          <a href={`tel:${dealer.phone}`} className="hover:text-[#DC2626]">
                            {dealer.phone}
                          </a>
                        </div>
                      </td>

                      {/* Outstanding / Limit */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-sm text-amber-800">
                          ₹{dealer.outstandingBalance.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500">
                          Limit: ₹{dealer.creditLimit.toLocaleString('en-IN')} ({creditUtilization}%)
                        </div>
                        <div className="w-24 bg-neutral-100 rounded-full h-1 mt-1 overflow-hidden">
                          <div
                            className={`h-1 rounded-full ${
                              creditUtilization > 80 ? 'bg-rose-600' : 'bg-neutral-800'
                            }`}
                            style={{ width: `${creditUtilization}%` }}
                          />
                        </div>
                      </td>

                      {/* Total Purchases */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-[#111827]">
                          ₹{dealer.totalPurchases.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] font-mono font-medium text-emerald-700 flex items-center gap-0.5 mt-0.5">
                          <Award className="w-3 h-3" />
                          <span>₹{dealer.availableRewards.toLocaleString('en-IN')} Points</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDealerForEdit(dealer);
                              setIsEditModalOpen(true);
                            }}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#E5E7EB] hover:border-neutral-400 hover:bg-neutral-50 text-[#111827] transition-all flex items-center gap-1 shadow-2xs"
                          >
                            <Pencil className="w-3 h-3 text-neutral-600" />
                            <span>Edit</span>
                          </button>

                          {cleanPhone.length >= 10 && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(dealer.ownerName)}%2C%20FILTEC%20Commercial%20Update.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Send WhatsApp"
                              className="p-1.5 rounded-md border border-[#E5E7EB] hover:border-emerald-300 hover:bg-emerald-50 text-neutral-600 hover:text-emerald-700 transition-colors"
                            >
                              <span className="text-[10px] font-mono font-bold text-emerald-700">WA</span>
                            </a>
                          )}

                          <Link
                            href={`/admin/orders?q=${encodeURIComponent(dealer.name)}`}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#E5E7EB] hover:bg-neutral-50 text-neutral-700 transition-colors"
                          >
                            Orders
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Edit Modal */}
      <EditDealerModal
        isOpen={isEditModalOpen}
        dealer={selectedDealerForEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDealerForEdit(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedDealerForEdit(null);
        }}
      />

      {/* Simple Onboard Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-[#111827]">Onboard New Dealer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardModalOpen(false)}
                className="text-[#6B7280] hover:text-[#111827]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDealer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Firm Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kalinga Pipes & Sanitary Mart"
                  value={newDealerData.name}
                  onChange={(e) => setNewDealerData({ ...newDealerData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Owner Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={newDealerData.ownerName}
                    onChange={(e) =>
                      setNewDealerData({ ...newDealerData, ownerName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Phone / WhatsApp <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 94370 00000"
                    value={newDealerData.phone}
                    onChange={(e) => setNewDealerData({ ...newDealerData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    City <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhubaneswar"
                    value={newDealerData.city}
                    onChange={(e) => setNewDealerData({ ...newDealerData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Commercial Tier
                  </label>
                  <select
                    value={newDealerData.tier}
                    onChange={(e) =>
                      setNewDealerData({ ...newDealerData, tier: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB]"
                  >
                    <option value="Platinum">Platinum</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Credit Limit (₹ INR)
                </label>
                <input
                  type="number"
                  step="25000"
                  value={newDealerData.creditLimit}
                  onChange={(e) =>
                    setNewDealerData({ ...newDealerData, creditLimit: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Physical Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street, market hub, pin code..."
                  value={newDealerData.address}
                  onChange={(e) => setNewDealerData({ ...newDealerData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-[#4B5563]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-xs"
                >
                  Save & Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
