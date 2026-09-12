'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore, store } from '@/data/store';
import { Building2, MapPin, Phone, PlusCircle, Search, Award, Pencil } from 'lucide-react';
import { EditDealerModal } from '@/components/admin/EditDealerModal';
import { Dealer } from '@/types';

export default function EmployeeDealersPage() {
  const { dealers } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedDealerForEdit, setSelectedDealerForEdit] = useState<Dealer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredDealers = dealers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Assigned Dealers" subtitle="Accounts & Credit Profile" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Dealer Directory</h2>
            <p className="text-xs text-[#6B7280]">
              Commercial terms, credit ceilings, outstanding balances, and quick order triggers
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dealer or city..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
            />
          </div>
        </div>

        {/* Dealer Master Data - Table List View */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F3F4F6] flex items-center justify-between bg-[#F9FAFB]">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#111827]">
                Assigned Dealer Accounts
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Commercial credit lines, outstanding ledgers, and fast order booking
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
              {filteredDealers.length} Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] uppercase font-mono text-[10px]">
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-4">Dealer / Vendor Account</th>
                  <th className="py-3 px-4">Location & Address</th>
                  <th className="py-3 px-4">Contact & Owner</th>
                  <th className="py-3 px-3">Outstanding / Limit</th>
                  <th className="py-3 px-3">Purchases & Rewards</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filteredDealers.map((dealer) => {
                  const creditUtilization = Math.min(
                    100,
                    Math.round((dealer.outstandingBalance / dealer.creditLimit) * 100)
                  );

                  return (
                    <tr
                      key={dealer.id}
                      className="hover:bg-neutral-50/80 transition-colors group"
                    >
                      {/* Code & Tier */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="tech-code font-bold text-xs bg-[#111827] text-white px-2 py-0.5 rounded font-mono">
                          {dealer.code}
                        </span>
                        <div className="text-[10px] font-mono font-medium text-neutral-600 mt-1">
                          {dealer.tier} Tier
                        </div>
                      </td>

                      {/* Dealer Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-[#111827]">
                          {dealer.name}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          {dealer.plumbersCount} Linked Plumber(s)
                        </div>
                      </td>

                      {/* Location & Address */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-1 text-neutral-700">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium text-[#111827]">{dealer.city}, {dealer.state}</span>
                            <p className="text-[11px] text-[#6B7280] line-clamp-1">{dealer.address}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Owner */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-[#111827]">{dealer.ownerName}</div>
                        <div className="flex items-center gap-1 font-mono text-[11px] text-[#6B7280] mt-0.5">
                          <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                          <a
                            href={`tel:${dealer.phone}`}
                            className="hover:text-[#DC2626] transition-colors"
                          >
                            {dealer.phone}
                          </a>
                        </div>
                      </td>

                      {/* Financials: Outstanding & Limit */}
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

                      {/* Purchases & Rewards */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-mono text-xs text-[#111827]">
                          ₹{dealer.totalPurchases.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] font-mono font-semibold text-emerald-700 flex items-center gap-0.5 mt-0.5">
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
                            title="Edit Dealer Contact Info"
                            className="p-1.5 rounded-md border border-[#E5E7EB] hover:bg-neutral-100 text-neutral-700 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`tel:${dealer.phone}`}
                            title="Call Dealer"
                            className="p-1.5 rounded-md border border-[#E5E7EB] hover:bg-neutral-100 text-neutral-700 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          <Link
                            href="/employee/orders/new"
                            onClick={() => store.setCartDealer(dealer.id)}
                            className="bg-[#111827] hover:bg-black text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-all flex items-center gap-1 shadow-xs"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Create Order</span>
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
    </div>
  );
}
