'use client';

import React, { useState } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore, store } from '@/data/store';
import { Plumber } from '@/types';
import {
  Users,
  Plus,
  Award,
  Phone,
  CheckCircle2,
  X,
  Send,
  Pencil,
  Edit3,
  UserCheck,
  UserX,
  Calendar,
  Building2,
  Check,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DealerPlumbersPage() {
  const { plumbers, dealers, currentUser } = useAppStore();
  const currentDealer = dealers.find((d) => d.id === currentUser.dealerId) || dealers[0];

  const dealerPlumbers = plumbers.filter((p) => p.dealerId === currentDealer.id);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Register New Plumber State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPlumberName, setNewPlumberName] = useState('');
  const [newPlumberPhone, setNewPlumberPhone] = useState('');

  // Edit Existing Plumber State
  const [editingPlumber, setEditingPlumber] = useState<Plumber | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editSuccess, setEditSuccess] = useState(false);

  // Reward Allocation State
  const [selectedPlumberForReward, setSelectedPlumberForReward] = useState<Plumber | null>(null);
  const [pointsToAllocate, setPointsToAllocate] = useState<number>(500);
  const [allocationSuccess, setAllocationSuccess] = useState(false);

  // Filtered Plumbers
  const filteredPlumbers = dealerPlumbers.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAllocatedAll = dealerPlumbers.reduce((s, p) => s + p.totalAllocatedRewards, 0);

  const handleAddPlumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlumberName.trim() || !newPlumberPhone.trim()) return;

    store.addPlumber(currentDealer.id, newPlumberName.trim(), newPlumberPhone.trim());
    setNewPlumberName('');
    setNewPlumberPhone('');
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (plumber: Plumber) => {
    setEditingPlumber(plumber);
    setEditName(plumber.name);
    setEditPhone(plumber.phone);
    setEditStatus(plumber.status);
    setEditSuccess(false);
  };

  const handleUpdatePlumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlumber || !editName.trim() || !editPhone.trim()) return;

    store.updatePlumber(editingPlumber.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      status: editStatus
    });

    setEditSuccess(true);
    setTimeout(() => {
      setEditSuccess(false);
      setEditingPlumber(null);
    }, 1000);
  };

  const handleAllocateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlumberForReward || pointsToAllocate <= 0) return;

    const ok = store.allocateRewardToPlumber(
      currentDealer.id,
      selectedPlumberForReward.id,
      pointsToAllocate
    );

    if (ok) {
      setAllocationSuccess(true);
      try {
        confetti({ particleCount: 40, spread: 50 });
      } catch (e) {}
      setTimeout(() => {
        setAllocationSuccess(false);
        setSelectedPlumberForReward(null);
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Plumber Management" subtitle={currentDealer.name} />
      <DesktopSubNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Header & Register Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Plumber Beneficiaries</h2>
            <p className="text-xs text-[#6B7280]">
              Onboard registered plumbers, edit contact info, and allocate commercial incentive points
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Plumber</span>
            </button>
          </div>
        </div>

        {/* Available balance snapshot */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[#6B7280] block font-semibold">
                Available Reward Pool to Allocate
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 mt-0.5">
                ₹{currentDealer.availableRewards.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <div className="text-xs text-[#6B7280] bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 self-start sm:self-auto font-medium">
            Dealer Exclusive Control • Direct Points Transfer
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by plumber name or phone number..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((filter) => {
              const isSelected = statusFilter === filter;
              const count =
                filter === 'ALL'
                  ? dealerPlumbers.length
                  : dealerPlumbers.filter((p) => p.status === filter).length;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-neutral-50'
                  }`}
                >
                  {filter === 'ALL'
                    ? `All (${count})`
                    : `${filter.charAt(0) + filter.slice(1).toLowerCase()} (${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plumbers List (Table View) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden">
          {/* List Subheader / Counter */}
          <div className="px-4 py-3 border-b border-[#F3F4F6] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F9FAFB]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-600" />
              <span className="text-xs font-bold uppercase font-mono tracking-wider text-[#111827]">
                Plumber Beneficiary Roster
              </span>
              <span className="text-[10px] font-mono text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                {filteredPlumbers.length} of {dealerPlumbers.length} Registered
              </span>
            </div>
            <div className="text-[11px] text-[#6B7280]">
              Total Incentives Dispatched:{' '}
              <strong className="font-mono text-[#111827]">
                ₹{totalAllocatedAll.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Tabular List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] uppercase font-mono text-[10px]">
                  <th className="py-3 px-4">Plumber Beneficiary</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Total Allocated</th>
                  <th className="py-3 px-4 text-center">Transactions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filteredPlumbers.length > 0 ? (
                  filteredPlumbers.map((plumber) => (
                    <tr key={plumber.id} className="hover:bg-neutral-50/80 transition-colors group">
                      {/* Plumber Beneficiary */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center justify-center shrink-0 border border-neutral-200">
                            {plumber.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[#111827] group-hover:text-[#DC2626] transition-colors">
                              {plumber.name}
                            </div>
                            <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                              Registered: {plumber.dateAdded}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-[#374151]">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{plumber.phone}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold border inline-flex items-center gap-1.5 ${
                            plumber.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              plumber.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-neutral-400'
                            }`}
                          />
                          {plumber.status}
                        </span>
                      </td>

                      {/* Total Allocated */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-sm text-[#111827]">
                          ₹{plumber.totalAllocatedRewards.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Transactions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono text-xs text-[#6B7280] bg-neutral-100 px-2.5 py-1 rounded-md">
                          {plumber.rewardHistoryCount} times
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(plumber)}
                            className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-neutral-50 text-[#374151] font-semibold text-xs transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-neutral-500" />
                            <span>Edit Info</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlumberForReward(plumber);
                              setPointsToAllocate(500);
                            }}
                            disabled={plumber.status !== 'ACTIVE'}
                            className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-black text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Award className="w-3 h-3 text-emerald-400" />
                            <span>Allocate</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[#6B7280]">
                      No registered plumbers found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Edit Plumber Modal */}
      {editingPlumber && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-4">
              <div>
                <h3 className="font-bold text-sm text-[#111827] flex items-center gap-1.5">
                  <Pencil className="w-4 h-4 text-[#DC2626]" />
                  <span>Edit Plumber Information</span>
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Update contact details and status for {editingPlumber.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlumber(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlumber} className="space-y-4 text-xs">
              {/* Plumber Name */}
              <div>
                <label className="font-semibold text-[#111827] block mb-1">
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Ramesh Prajapati"
                  className="w-full p-2.5 rounded-lg border border-[#D1D5DB] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626] text-xs font-medium"
                />
              </div>

              {/* Plumber Phone */}
              <div>
                <label className="font-semibold text-[#111827] block mb-1">
                  Phone Number (for SMS & WhatsApp Alerts) <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 98250 00000"
                  className="w-full p-2.5 rounded-lg border border-[#D1D5DB] bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#DC2626] text-xs"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="font-semibold text-[#111827] block mb-1.5">
                  Beneficiary Status:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('ACTIVE')}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                      editStatus === 'ACTIVE'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-1 ring-emerald-500'
                        : 'border-[#E5E7EB] bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold block text-xs">Active</span>
                        <span className="text-[10px] text-neutral-500">Eligible for rewards</span>
                      </div>
                    </div>
                    {editStatus === 'ACTIVE' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStatus('INACTIVE')}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                      editStatus === 'INACTIVE'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-800 ring-1 ring-amber-500'
                        : 'border-[#E5E7EB] bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserX className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="font-bold block text-xs">Inactive</span>
                        <span className="text-[10px] text-neutral-500">Temporarily paused</span>
                      </div>
                    </div>
                    {editStatus === 'INACTIVE' && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                </div>
              </div>

              {/* Readonly Summary Info */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-[#E5E7EB] space-y-1.5 text-[11px] text-[#6B7280]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-neutral-400" />
                    <span>Linked Dealer:</span>
                  </span>
                  <span className="font-medium text-[#111827]">{editingPlumber.dealerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-neutral-400" />
                    <span>Registration Date:</span>
                  </span>
                  <span className="font-mono text-[#111827]">{editingPlumber.dateAdded}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                  <span>Total Rewards Allocated:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    ₹{editingPlumber.totalAllocatedRewards.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlumber(null)}
                  className="flex-1 py-2.5 rounded-lg border border-[#D1D5DB] text-[#374151] hover:bg-neutral-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSuccess}
                  className="flex-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:bg-emerald-600"
                >
                  {editSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Changes Saved!</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Plumber Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
              <h3 className="font-bold text-sm text-[#111827]">Register Plumber</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPlumber} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#111827] block mb-1">Plumber Full Name:</label>
                <input
                  type="text"
                  required
                  value={newPlumberName}
                  onChange={(e) => setNewPlumberName(e.target.value)}
                  placeholder="e.g. Ramesh Prajapati"
                  className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#111827] block mb-1">Phone Number (for WhatsApp SMS):</label>
                <input
                  type="tel"
                  required
                  value={newPlumberPhone}
                  onChange={(e) => setNewPlumberPhone(e.target.value)}
                  placeholder="+91 98250 00000"
                  className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold py-2.5 rounded-lg transition-all cursor-pointer"
              >
                Save Plumber
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Points Modal */}
      {selectedPlumberForReward && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
              <div>
                <h3 className="font-bold text-sm text-[#111827]">Allocate Reward Points</h3>
                <p className="text-[11px] text-[#6B7280]">To: {selectedPlumberForReward.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlumberForReward(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAllocateReward} className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-[#4B5563] mb-1">
                  <span>Your Available Balance:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    ₹{currentDealer.availableRewards.toLocaleString('en-IN')}
                  </span>
                </div>

                <label className="font-semibold text-[#111827] block mb-1">Reward Points (₹):</label>
                <input
                  type="number"
                  min="50"
                  max={currentDealer.availableRewards}
                  step="50"
                  required
                  value={pointsToAllocate}
                  onChange={(e) => setPointsToAllocate(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {[250, 500, 1000, 2000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPointsToAllocate(preset)}
                    className="flex-1 py-1 rounded border border-[#E5E7EB] bg-neutral-50 hover:bg-neutral-100 text-[11px] font-mono cursor-pointer"
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={pointsToAllocate > currentDealer.availableRewards || pointsToAllocate <= 0}
                className="w-full mt-3 bg-[#111827] hover:bg-black text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {allocationSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Transferred & WhatsApp Dispatched!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm Points Transfer</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
