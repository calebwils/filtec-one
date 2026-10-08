'use client';

import React, { useState } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore, store } from '@/data/store';
import { Plumber, RewardVoucher } from '@/types';
import { RewardVoucherCard } from '@/components/rewards/RewardVoucherCard';
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
  Search,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Ticket
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DealerPlumbersPage() {
  const { plumbers, dealers, currentUser, rewardVouchers } = useAppStore();
  const currentDealer = dealers.find((d) => d.id === currentUser.dealerId || d.code === currentUser.dealerId) || dealers[0];

  const dealerPlumbers = plumbers.filter((p) => p.dealerId === currentDealer.id || p.dealerName === currentDealer.name);

  // Voucher Preview State
  const [createdPlumberVoucher, setCreatedPlumberVoucher] = useState<RewardVoucher | null>(null);
  const [viewingVoucher, setViewingVoucher] = useState<RewardVoucher | null>(null);

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

  // Calculate voucher totals and available rewards for each plumber
  const getPlumberVouchers = (plumberId: string) => {
    return (rewardVouchers || []).filter(
      (v) => v.plumberId === plumberId && v.type === 'PLUMBER'
    );
  };

  const getPlumberIssuedTotal = (plumberId: string) => {
    return getPlumberVouchers(plumberId).reduce((sum, v) => sum + (v.amount || 0), 0);
  };

  const getPlumberAvailableRewards = (plumber: Plumber) => {
    // totalAllocatedRewards is decremented when vouchers are issued, so it IS the remaining balance
    return Math.max(0, Number((plumber.totalAllocatedRewards || 0).toFixed(2)));
  };

  // Reward Allocation State
  const [selectedPlumberForReward, setSelectedPlumberForReward] = useState<Plumber | null>(null);
  const [allocationSource, setAllocationSource] = useState<'PLUMBER_POOL' | 'DEALER_ACCOUNT' | 'ESCROW'>('PLUMBER_POOL');
  const [pointsToAllocate, setPointsToAllocate] = useState<number>(0);
  const [allocationSuccess, setAllocationSuccess] = useState(false);

  // Plumber picker for header Allocate button
  const [isPickPlumberOpen, setIsPickPlumberOpen] = useState(false);

  // All Plumbers Directory modal for header Plumbers button
  const [isAllPlumbersModalOpen, setIsAllPlumbersModalOpen] = useState(false);
  const [plumberDirectorySearch, setPlumberDirectorySearch] = useState('');

  // Filtered Plumbers
  const filteredPlumbers = dealerPlumbers.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getPlumberVouchers(p.id).some((v) => (v.voucherNumber || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Dedicated line per transaction in the Ledger:
  // Plumbers without transactions are NOT in the ledger table.
  // All plumber management and editing is available via the "Plumbers" header button.
  const transactionRows = filteredPlumbers.flatMap((plumber) => {
    const pVouchers = getPlumberVouchers(plumber.id);
    return pVouchers.map((voucher) => ({
      rowKey: `plumber-${plumber.id}-v-${voucher.id}`,
      plumber,
      voucher,
    }));
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

  const handleOpenAllocateModal = (plumber: Plumber) => {
    setSelectedPlumberForReward(plumber);
    setCreatedPlumberVoucher(null);
    setAllocationSuccess(false);

    const plumberAvail = getPlumberAvailableRewards(plumber);
    const dealerAvail = Number((currentDealer.availableRewards || 0).toFixed(2));
    const escrowAvail = Number((currentDealer.pendingPlumberRewards || 0).toFixed(2));

    if (plumberAvail > 0) {
      setAllocationSource('PLUMBER_POOL');
      setPointsToAllocate(plumberAvail);
    } else if (escrowAvail > 0) {
      setAllocationSource('ESCROW');
      setPointsToAllocate(escrowAvail);
    } else if (dealerAvail > 0) {
      setAllocationSource('DEALER_ACCOUNT');
      setPointsToAllocate(dealerAvail);
    } else {
      setAllocationSource('PLUMBER_POOL');
      setPointsToAllocate(0);
    }
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

  const handleAllocateReward = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedPlumberForReward || pointsToAllocate <= 0) return;

    try {
      const targetDealerId = selectedPlumberForReward.dealerId || currentDealer.id;
      const voucher = store.allocateRewardToPlumber(
        targetDealerId,
        selectedPlumberForReward,
        pointsToAllocate,
        allocationSource
      );

      if (voucher) {
        setAllocationSuccess(true);
        setCreatedPlumberVoucher(voucher);
        try {
          confetti({ particleCount: 45, spread: 55, origin: { y: 0.6 } });
        } catch (cErr) {}
      } else {
        alert('Could not allocate points. Please ensure sufficient points are available in the selected source.');
      }
    } catch (err: any) {
      console.error('Error allocating reward to plumber:', err);
      alert('Error allocating reward: ' + (err?.message || 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Plumber Management" />
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
              onClick={() => setIsAllPlumbersModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-neutral-50 text-[#111827] border border-[#D1D5DB] text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-neutral-600" />
              <span>Plumbers</span>
              <span className="text-[10px] font-mono bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded-full font-bold">
                {dealerPlumbers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Plumber</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPickPlumberOpen(true)}
              disabled={dealerPlumbers.filter((p) => p.status === 'ACTIVE').length === 0}
              className="inline-flex items-center gap-1.5 bg-[#111827] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Allocate Reward</span>
            </button>
          </div>
        </div>

        {/* Plumber Escrow Banner (If dealer has pending escrow rewards from orders without plumbers) */}
        {(currentDealer.pendingPlumberRewards || 0) > 0 && (
          <div className="bg-amber-50/90 border-2 border-amber-300 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-amber-200 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-amber-950">
                    ₹{(currentDealer.pendingPlumberRewards || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} Plumber Rewards Held in Escrow
                  </span>
                  <span className="bg-amber-200/70 text-amber-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                    Protected by Policy
                  </span>
                </div>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed max-w-2xl">
                  Under FILTEC commercial policy, plumber rewards <strong>stay in escrow and NEVER go to the dealer</strong> until you onboard a new plumber. When you register a new plumber below, this entire <strong>₹{(currentDealer.pendingPlumberRewards || 0).toLocaleString('en-IN')}</strong> will automatically be unlocked and credited directly to them!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard Plumber Now</span>
            </button>
          </div>
        )}

        {/* Dual Balance Snapshots: Dealer Account (75%) vs Plumber Pool (25%) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#6B7280] block font-semibold">
                  Dealer Reward Account
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 mt-0.5">
                  ₹{currentDealer.availableRewards.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-emerald-800">Dealer 75% share of 1% order value</span>
              </div>
            </div>
          </div>

          <div className={`border rounded-xl p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-4 ${
            (currentDealer.pendingPlumberRewards || 0) > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-[#E5E7EB]'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                (currentDealer.pendingPlumberRewards || 0) > 0 ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-600'
              }`}>
                {(currentDealer.pendingPlumberRewards || 0) > 0 ? <Lock className="w-5 h-5" /> : <Award className="w-5 h-5 text-blue-600" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono text-[#6B7280] block font-semibold">
                    Plumber Reward Pool (25% Share)
                  </span>
                  <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                    Plumber 25% Share
                  </span>
                </div>
                <div className={`text-xl sm:text-2xl font-bold font-mono mt-0.5 ${(currentDealer.pendingPlumberRewards || 0) > 0 ? 'text-amber-900' : 'text-blue-700'}`}>
                  ₹{Number((totalAllocatedAll + (currentDealer.pendingPlumberRewards || 0)).toFixed(2)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span className={`text-[11px] font-medium ${(currentDealer.pendingPlumberRewards || 0) > 0 ? 'text-amber-800' : 'text-[#6B7280]'}`}>
                  {(currentDealer.pendingPlumberRewards || 0) > 0
                    ? `₹${(currentDealer.pendingPlumberRewards || 0).toFixed(2)} held in escrow awaiting plumber onboarding`
                    : `25% of 1% order value (₹${totalAllocatedAll.toFixed(2)} credited to registered plumbers)`}
                </span>
              </div>
            </div>
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
                Plumber Beneficiary Ledger
              </span>
              <span className="text-[10px] font-mono text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                {transactionRows.length} Transaction{transactionRows.length === 1 ? '' : 's'}
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
                  <th className="py-3 px-3">Plumber Status</th>
                  <th className="py-3 px-4">Coupon / Transaction</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Txn Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {transactionRows.length > 0 ? (
                  transactionRows.map((row) => {
                    const plumber = row.plumber;
                    const voucher = row.voucher;
                    return (
                      <tr key={row.rowKey} className="hover:bg-neutral-50/80 transition-colors group">
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

                        {/* Plumber Status */}
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

                        {/* Coupon / Transaction */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {voucher ? (
                            <button
                              type="button"
                              onClick={() => setViewingVoucher(voucher)}
                              className="inline-flex items-center gap-1.5 text-left bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded px-2 py-1 transition-colors cursor-pointer group/btn"
                              title={`View Coupon ${voucher.voucherNumber}`}
                            >
                              <Ticket className="w-3 h-3 text-blue-600" />
                              <span className="font-mono font-bold text-xs">
                                {voucher.voucherNumber}
                              </span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-neutral-400 font-mono italic">
                              No transaction yet
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-neutral-600 font-mono text-xs">
                          {voucher ? (voucher.dateRedeemed || voucher.createdAt?.split('T')[0] || '—') : '—'}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {voucher ? (
                            <div className="font-mono font-bold text-sm text-[#111827]">
                              ₹{(voucher.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                          ) : (
                            <div className="font-mono text-xs text-neutral-400">
                              ₹0.00
                            </div>
                          )}
                        </td>

                        {/* Txn Status */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {voucher ? (
                            <span
                              className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-semibold border ${
                                voucher.status === 'SETTLED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {voucher.status}
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-400 font-mono">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(plumber)}
                            className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-neutral-50 text-[#374151] font-semibold text-xs transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-neutral-500" />
                            <span>Edit Info</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#6B7280]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Ticket className="w-8 h-8 text-neutral-300" />
                        <span className="font-semibold text-neutral-700">No voucher transactions recorded yet</span>
                        <span className="text-neutral-500 text-[11px]">
                          Reward transactions will appear here once allocated to registered plumbers.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* All Plumbers Directory Modal (Triggered by Header 'Plumbers' Button) */}
      {isAllPlumbersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
                  <Users className="w-5 h-5 text-[#DC2626]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2">
                    <span>Registered Plumber Directory</span>
                    <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full border border-neutral-200">
                      {dealerPlumbers.length} Plumber{dealerPlumbers.length === 1 ? '' : 's'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    View all registered plumbers and manage or edit their contact details and status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAllPlumbersModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Filter Search */}
            <div className="py-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={plumberDirectorySearch}
                  onChange={(e) => setPlumberDirectorySearch(e.target.value)}
                  placeholder="Filter plumbers by name or phone..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-neutral-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            {/* Plumbers List */}
            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 py-1">
              {dealerPlumbers
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(plumberDirectorySearch.toLowerCase()) ||
                    p.phone.toLowerCase().includes(plumberDirectorySearch.toLowerCase())
                )
                .map((plumber) => {
                  const avail = getPlumberAvailableRewards(plumber);
                  const pVouchers = getPlumberVouchers(plumber.id);
                  return (
                    <div
                      key={plumber.id}
                      className="p-3 rounded-xl border border-[#E5E7EB] bg-white hover:border-neutral-300 hover:shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center justify-center shrink-0 border border-neutral-200">
                          {plumber.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#111827]">
                              {plumber.name}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold border inline-flex items-center gap-1 ${
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
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-[#6B7280] font-mono mt-0.5">
                            <span className="flex items-center gap-1 text-[#374151]">
                              <Phone className="w-3 h-3 text-neutral-400" />
                              {plumber.phone}
                            </span>
                            <span>&bull;</span>
                            <span>Registered: {plumber.dateAdded}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F3F4F6]">
                        <div className="text-left sm:text-right">
                          <div className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded inline-block">
                            ₹{avail.toFixed(2)} Available
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                            {pVouchers.length} transaction{pVouchers.length === 1 ? '' : 's'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenEditModal(plumber);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-neutral-50 text-[#374151] font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-neutral-500" />
                            <span>Edit Info</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {dealerPlumbers.length === 0 && (
                <div className="py-10 text-center text-xs text-[#6B7280]">
                  No plumbers registered yet. Click &quot;Register New Plumber&quot; to onboard one.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAllPlumbersModalOpen(false);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:text-[#B91C1C] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register New Plumber</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAllPlumbersModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#D1D5DB] text-xs font-semibold text-[#374151] hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Plumber to Allocate Reward Modal (Triggered by Header Allocate Button) */}
      {isPickPlumberOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-4">
              <div>
                <h3 className="font-bold text-sm text-[#111827] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Select Plumber to Allocate Reward</span>
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Choose an active registered plumber to allocate reward points
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPickPlumberOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {dealerPlumbers.filter((p) => p.status === 'ACTIVE').length > 0 ? (
                dealerPlumbers
                  .filter((p) => p.status === 'ACTIVE')
                  .map((plumber) => {
                    const avail = getPlumberAvailableRewards(plumber);
                    return (
                      <button
                        key={plumber.id}
                        type="button"
                        onClick={() => {
                          setIsPickPlumberOpen(false);
                          handleOpenAllocateModal(plumber);
                        }}
                        className="w-full text-left p-3 rounded-lg border border-[#E5E7EB] hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center justify-center shrink-0 border border-neutral-200 group-hover:bg-emerald-100 group-hover:text-emerald-800">
                            {plumber.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[#111827] group-hover:text-emerald-900">
                              {plumber.name}
                            </div>
                            <div className="text-[10px] text-[#6B7280] font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-neutral-400" />
                              <span>{plumber.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                            ₹{avail.toFixed(2)} Available
                          </div>
                          <span className="text-[10px] text-emerald-600 font-semibold group-hover:underline mt-1 block">
                            Select & Allocate &rarr;
                          </span>
                        </div>
                      </button>
                    );
                  })
              ) : (
                <div className="py-6 text-center text-xs text-[#6B7280]">
                  No active plumbers available. Please onboard or activate a plumber first.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex justify-end">
              <button
                type="button"
                onClick={() => setIsPickPlumberOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#D1D5DB] text-xs font-semibold text-[#374151] hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plumber Modal */}
      {editingPlumber && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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

              {(currentDealer.pendingPlumberRewards || 0) > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-[11px] text-amber-950 flex items-start gap-2">
                  <Unlock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-amber-950">
                      ₹{(currentDealer.pendingPlumberRewards || 0).toLocaleString('en-IN')} Escrow Unlocking:
                    </strong>
                    <p className="text-amber-800 mt-0.5 leading-tight">
                      This new plumber will immediately receive the full ₹{(currentDealer.pendingPlumberRewards || 0).toLocaleString('en-IN')} currently held in escrow upon saving!
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold py-2.5 rounded-lg transition-all cursor-pointer"
              >
                Save Plumber {((currentDealer.pendingPlumberRewards || 0) > 0) ? `& Release ₹${(currentDealer.pendingPlumberRewards || 0).toLocaleString('en-IN')} Rewards` : ''}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Points Modal */}
      {selectedPlumberForReward && (() => {
        const selectedPlumberAvail = getPlumberAvailableRewards(selectedPlumberForReward);
        const dealerAvail = Number((currentDealer.availableRewards || 0).toFixed(2));
        const escrowAvail = Number((currentDealer.pendingPlumberRewards || 0).toFixed(2));

        const maxAvailable =
          allocationSource === 'PLUMBER_POOL'
            ? selectedPlumberAvail
            : allocationSource === 'DEALER_ACCOUNT'
            ? dealerAvail
            : escrowAvail;

        const presets = [
          ...(maxAvailable >= 100 ? [100] : []),
          ...(maxAvailable >= 250 ? [250] : []),
          ...(maxAvailable >= 500 ? [500] : []),
          ...(maxAvailable >= 1000 ? [1000] : [])
        ];

        return (
          <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#111827]">
                      {createdPlumberVoucher ? `Virtual Reward Card • ${createdPlumberVoucher.voucherNumber}` : 'Allocate Reward Points'}
                    </h3>
                    <p className="text-[11px] text-[#6B7280]">
                      {createdPlumberVoucher ? `Direct dispatch to ${selectedPlumberForReward.name} (${selectedPlumberForReward.phone})` : `Beneficiary: ${selectedPlumberForReward.name} (${selectedPlumberForReward.phone})`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedPlumberVoucher(null);
                    setSelectedPlumberForReward(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createdPlumberVoucher ? (
                <div className="space-y-3">
                  <RewardVoucherCard
                    voucher={createdPlumberVoucher}
                    onClose={() => {
                      setCreatedPlumberVoucher(null);
                      setSelectedPlumberForReward(null);
                    }}
                  />
                </div>
              ) : (
                <form onSubmit={handleAllocateReward} className="space-y-4 text-xs">
                  {/* Source Selection */}
                  <div>
                    <label className="font-semibold text-[#111827] block mb-1.5">
                      Select Funding Source:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Source 1: Plumber Reward Pool */}
                      <button
                        type="button"
                        onClick={() => {
                          setAllocationSource('PLUMBER_POOL');
                          setPointsToAllocate(selectedPlumberAvail > 0 ? (selectedPlumberAvail >= 1 ? Math.floor(selectedPlumberAvail) : selectedPlumberAvail) : 0);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          allocationSource === 'PLUMBER_POOL'
                            ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                            : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-blue-950">Plumber 25% Pool</span>
                          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">
                            ₹{selectedPlumberAvail.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-1 leading-tight">
                          Earned from customer orders. Recommended.
                        </p>
                      </button>

                      {/* Source 2: Dealer Reward Account */}
                      <button
                        type="button"
                        onClick={() => {
                          setAllocationSource('DEALER_ACCOUNT');
                          setPointsToAllocate(dealerAvail > 0 ? (dealerAvail >= 1 ? Math.floor(dealerAvail) : dealerAvail) : 0);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          allocationSource === 'DEALER_ACCOUNT'
                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                            : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-emerald-950">Dealer 75% Account</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                            ₹{dealerAvail.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-1 leading-tight">
                          Transfer from dealer profit reward account.
                        </p>
                      </button>

                      {/* Source 3: Escrow (if available) */}
                      {escrowAvail > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAllocationSource('ESCROW');
                            setPointsToAllocate(escrowAvail);
                          }}
                          className={`col-span-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            allocationSource === 'ESCROW'
                              ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600'
                              : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] text-amber-950">Plumber Escrow Pool</span>
                            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">
                              ₹{escrowAvail.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-1 leading-tight">
                            Release funds held in escrow from orders before plumber onboarding.
                          </p>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Points Input & Balance Bar */}
                  <div>
                    <div className="flex justify-between text-[#4B5563] mb-1">
                      <span>Available in Selected Source:</span>
                      <span className={`font-mono font-bold ${
                        allocationSource === 'PLUMBER_POOL' ? 'text-blue-700' : 'text-emerald-700'
                      }`}>
                        ₹{maxAvailable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <label className="font-semibold text-[#111827] block mb-1">Reward Points to Allocate (₹):</label>
                    <input
                      type="number"
                      min="0.01"
                      max={maxAvailable}
                      step="any"
                      required
                      value={pointsToAllocate === 0 ? '' : pointsToAllocate}
                      onChange={(e) => setPointsToAllocate(parseFloat(e.target.value) || 0)}
                      placeholder={`e.g. ${maxAvailable > 0 ? maxAvailable : '100'}`}
                      className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                    />
                  </div>

                  {/* Smart Presets */}
                  {maxAvailable > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {presets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setPointsToAllocate(preset)}
                          className="flex-1 min-w-[60px] py-1 rounded-md border border-[#E5E7EB] bg-neutral-50 hover:bg-neutral-100 text-[11px] font-mono cursor-pointer transition-colors"
                        >
                          ₹{preset}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPointsToAllocate(maxAvailable)}
                        className="py-1 px-2.5 rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[11px] font-mono font-bold text-blue-700 cursor-pointer transition-colors"
                      >
                        Full (₹{maxAvailable.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                      </button>
                    </div>
                  )}

                  {/* WhatsApp Delivery Note */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 leading-relaxed">
                    <p>
                      <strong>WhatsApp Delivery:</strong> {selectedPlumberForReward.name} will immediately receive the official Virtual Card and coupon code <strong className="font-mono text-blue-700">P-xxx</strong> on WhatsApp (<strong>{selectedPlumberForReward.phone}</strong>) with the FILTEC Head Office settlement hotline (<strong>+91 94378 60479</strong>).
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    onClick={(e) => handleAllocateReward(e)}
                    disabled={pointsToAllocate <= 0 || pointsToAllocate > maxAvailable || maxAvailable <= 0}
                    className="w-full bg-[#111827] hover:bg-black text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {maxAvailable <= 0
                        ? 'Insufficient Balance in Selected Source'
                        : pointsToAllocate > maxAvailable
                        ? `Amount Exceeds Available (₹${maxAvailable.toFixed(2)})`
                        : pointsToAllocate <= 0
                        ? 'Enter Reward Points'
                        : `Confirm Points Transfer & Issue Coupon (₹${pointsToAllocate})`}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* View Saved Voucher Modal */}
      {viewingVoucher && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-[#111827]">
                  Plumber Coupon {viewingVoucher.voucherNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingVoucher(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <RewardVoucherCard
              voucher={viewingVoucher}
              onClose={() => setViewingVoucher(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
