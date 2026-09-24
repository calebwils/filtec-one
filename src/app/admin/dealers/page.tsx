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
  ShieldCheck,
  Eye,
  Mail,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { EditDealerModal } from '@/components/admin/EditDealerModal';
import { ViewDealerModal } from '@/components/admin/ViewDealerModal';
import { Dealer } from '@/types';

export default function AdminDealersPage() {
  const { dealers, employees } = useAppStore();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'UNASSIGNED'>('ALL');
  const [selectedDealerForEdit, setSelectedDealerForEdit] = useState<Dealer | null>(null);
  const [selectedDealerForView, setSelectedDealerForView] = useState<Dealer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

  // New Dealer state for simple onboard modal
  const [newDealerData, setNewDealerData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    email: '',
    city: '',
    state: '21-Odisha',
    address: '',
    pincode: '',
    gstin: '',
    creditLimit: 0,
    tier: 'Gold' as 'Platinum' | 'Gold' | 'Silver',
    assignedRepId: '' as string | undefined
  });

  const totalPlumbers = dealers.reduce((sum, d) => sum + (d.plumbersCount || 0), 0);
  const uniqueDistricts = new Set(dealers.map((d) => d.city).filter(Boolean)).size;
  const assignedStaffCount = dealers.filter((d) => Boolean(d.assignedRepId)).length;
  const unassignedCount = dealers.length - assignedStaffCount;

  const filteredDealers = dealers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase()) ||
      d.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      (d.phone && d.phone.includes(search));

    if (!matchesSearch) return false;

    if (tierFilter === 'UNASSIGNED') {
      return !d.assignedRepId;
    }
    return true;
  });

  const handleCreateDealer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealerData.name || !newDealerData.ownerName || !newDealerData.phone) return;

    store.onboardDealer({
      name: newDealerData.name,
      ownerName: newDealerData.ownerName,
      phone: newDealerData.phone,
      email: newDealerData.email || undefined,
      city: newDealerData.city || 'Bhubaneswar',
      state: newDealerData.state || '21-Odisha',
      address: newDealerData.address || 'Commercial Market',
      pincode: newDealerData.pincode || undefined,
      gstin: newDealerData.gstin ? newDealerData.gstin.trim().toUpperCase() : undefined,
      creditLimit: 0,
      tier: newDealerData.tier
    });

    setIsOnboardModalOpen(false);
    setNewDealerData({
      name: '',
      ownerName: '',
      phone: '',
      email: '',
      city: '',
      state: '21-Odisha',
      address: '',
      pincode: '',
      gstin: '',
      creditLimit: 0,
      tier: 'Gold',
      assignedRepId: ''
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Dealer Directory" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Authorized Dealer Network</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOnboardModalOpen(true)}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Onboard Dealer</span>
            </button>
          </div>
        </div>

        {/* Operational & Network KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <span className="font-mono uppercase font-semibold text-[10px]">Districts & Clusters</span>
              <MapPin className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-bold font-mono text-[#111827]">
              {uniqueDistricts} Hubs
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">
              Statewide Territory Coverage
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
              <span className="font-mono uppercase font-semibold text-[10px]">Linked Plumbers</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-800">{totalPlumbers} Plumbers</div>
            <span className="text-[10px] text-neutral-500 font-medium">Generating Secondary Demand</span>
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
              placeholder="Search by dealer firm, owner, city, phone, ID..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {(['ALL', 'UNASSIGNED'] as const).map((filter) => {
              const isSelected = tierFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTierFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-neutral-50'
                  }`}
                >
                  {filter === 'ALL'
                    ? 'All'
                    : `Unassigned (${unassignedCount})`}
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
                  <th className="py-3 px-3">Assigned Sales Officer</th>
                  <th className="py-3 px-3">Purchases</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filteredDealers.map((dealer) => {
                  const cleanPhone = dealer.phone.replace(/[^0-9]/g, '');

                  return (
                    <tr key={dealer.id} className="hover:bg-neutral-50/80 transition-colors group">
                      {/* Code & Tier */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDealerForView(dealer);
                            setIsViewModalOpen(true);
                          }}
                          className="tech-code font-bold text-xs bg-[#111827] hover:bg-neutral-800 text-white px-2 py-0.5 rounded font-mono cursor-pointer transition-colors"
                          title="Click to view details"
                        >
                          {dealer.code}
                        </button>
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

                      {/* Name & GSTIN */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDealerForView(dealer);
                            setIsViewModalOpen(true);
                          }}
                          className="font-bold text-sm text-[#111827] hover:text-[#DC2626] text-left transition-colors cursor-pointer block"
                        >
                          {dealer.name}
                        </button>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded border border-neutral-200">
                            GSTIN: {dealer.gstin || 'URP'}
                          </span>
                          <span className="text-[11px] text-[#6B7280] font-mono">
                            • {dealer.plumbersCount} Linked Plumber(s)
                          </span>
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

                      {/* Assigned Sales Officer */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {dealer.assignedRepId ? (
                          (() => {
                            const rep = employees.find(
                              (e) => e.id === dealer.assignedRepId || e.code === dealer.assignedRepId
                            );
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDealerForEdit(dealer);
                                  setIsEditModalOpen(true);
                                }}
                                className="flex items-center gap-1.5 text-left hover:opacity-80 transition-opacity cursor-pointer group"
                                title="Click to change assigned staff"
                              >
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center font-mono shrink-0">
                                  {rep ? rep.name.slice(0, 2).toUpperCase() : 'SO'}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-[#111827] group-hover:text-[#DC2626] transition-colors">
                                    {rep ? rep.name : dealer.assignedRepId}
                                  </div>
                                  <div className="text-[10px] text-[#6B7280] font-mono">
                                    {rep?.phone || 'Field Officer'}
                                  </div>
                                </div>
                              </button>
                            );
                          })()
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDealerForEdit(dealer);
                              setIsEditModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-[#DC2626] bg-neutral-50 hover:bg-neutral-100 px-2 py-1 rounded border border-dashed border-neutral-300 transition-colors cursor-pointer"
                            title="Click to assign field representative"
                          >
                            <UserPlus className="w-3 h-3 text-neutral-400" />
                            <span>+ Assign Staff</span>
                          </button>
                        )}
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
                              setSelectedDealerForView(dealer);
                              setIsViewModalOpen(true);
                            }}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#E5E7EB] hover:border-neutral-400 hover:bg-neutral-50 text-[#111827] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="w-3 h-3 text-neutral-600" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDealerForEdit(dealer);
                              setIsEditModalOpen(true);
                            }}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#E5E7EB] hover:border-neutral-400 hover:bg-neutral-50 text-[#111827] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
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

      {/* View Dealer Profile Modal */}
      <ViewDealerModal
        isOpen={isViewModalOpen}
        dealer={selectedDealerForView}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedDealerForView(null);
        }}
        onEdit={(dealer) => {
          setSelectedDealerForEdit(dealer);
          setIsEditModalOpen(true);
        }}
      />

      {/* Simple Onboard Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-[#111827]">Onboard New Dealer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardModalOpen(false)}
                className="text-[#6B7280] hover:text-[#111827] cursor-pointer"
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
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 21AMMPB6918J1Z3"
                    value={newDealerData.gstin}
                    onChange={(e) =>
                      setNewDealerData({ ...newDealerData, gstin: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. dealer@filtec.in"
                    value={newDealerData.email}
                    onChange={(e) =>
                      setNewDealerData({ ...newDealerData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB]"
                  />
                </div>
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    City <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kendrapara"
                    value={newDealerData.city}
                    onChange={(e) => setNewDealerData({ ...newDealerData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="21-Odisha"
                    value={newDealerData.state}
                    onChange={(e) => setNewDealerData({ ...newDealerData, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    placeholder="754225"
                    value={newDealerData.pincode}
                    onChange={(e) => setNewDealerData({ ...newDealerData, pincode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Assigned Sales Staff
                  </label>
                  <select
                    value={newDealerData.assignedRepId || ''}
                    onChange={(e) =>
                      setNewDealerData({ ...newDealerData, assignedRepId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                  >
                    <option value="">Unassigned (Open Territory)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.designation || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
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
                  className="px-3.5 py-1.5 text-xs text-[#4B5563] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-xs cursor-pointer"
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
