'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Award,
  Users,
  Copy,
  Check,
  Pencil,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  FileText,
  UserCheck
} from 'lucide-react';
import { Dealer } from '@/types';
import { useAppStore } from '@/data/store';

interface ViewDealerModalProps {
  dealer: Dealer | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (dealer: Dealer) => void;
}

export function ViewDealerModal({ dealer, isOpen, onClose, onEdit }: ViewDealerModalProps) {
  const { employees } = useAppStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !dealer) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanPhone = dealer.phone.replace(/[^0-9]/g, '');
  const assignedEmp = employees.find(
    (e) => e.id === dealer.assignedRepId || e.code === dealer.assignedRepId
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#111827] to-[#1F2937] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
              <Building2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] bg-white/15 px-2 py-0.5 rounded font-bold text-neutral-200">
                  {dealer.code}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    dealer.tier === 'Platinum'
                      ? 'bg-purple-950/80 text-purple-300 border-purple-400/30'
                      : dealer.tier === 'Gold'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-400/30'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-600'
                  }`}
                >
                  {dealer.tier} Partner
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">{dealer.name}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Assigned Sales Staff</div>
              <div className="font-bold text-sm text-[#111827] mt-0.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{assignedEmp ? assignedEmp.name : 'Unassigned (All Staff)'}</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                {assignedEmp ? `${assignedEmp.code} • ${assignedEmp.designation || 'Field Rep'}` : 'Open territory access'}
              </span>
            </div>

            <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">District / Territory</div>
              <div className="font-bold text-sm text-[#111827] mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>{dealer.city}</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                {dealer.state} • Code: 21
              </span>
            </div>

            <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Linked Plumbers</div>
              <div className="font-bold text-sm text-purple-700 mt-0.5 font-mono flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{dealer.plumbersCount || 0} Plumbers</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                Secondary network pool
              </span>
            </div>
          </div>

          {/* Section 1: Firm & Tax Identification */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6] text-xs font-bold text-[#111827] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#DC2626]" />
              <span>Tax & Commercial Registration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-neutral-500 block text-[11px]">GSTIN / Tax ID</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 text-xs">
                    {dealer.gstin || 'URP / Unregistered'}
                  </span>
                  {dealer.gstin && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(dealer.gstin!, 'gstin')}
                      className="text-neutral-400 hover:text-neutral-800 p-1 transition-colors"
                      title="Copy GSTIN"
                    >
                      {copiedField === 'gstin' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">Authorized Proprietor / Owner</span>
                <span className="font-semibold text-neutral-900 mt-0.5 block">
                  {dealer.ownerName || '—'}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">Contact Phone</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-semibold text-neutral-900">{dealer.phone}</span>
                  <a
                    href={`tel:${dealer.phone}`}
                    className="text-neutral-400 hover:text-red-600 p-0.5"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">Official Email</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-neutral-900 font-medium">
                    {dealer.email || 'care@mamatasanitary.in'}
                  </span>
                  {dealer.email && (
                    <a
                      href={`mailto:${dealer.email}`}
                      className="text-neutral-400 hover:text-blue-600 p-0.5"
                      title="Send Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Depot & Location Address */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6] text-xs font-bold text-[#111827] uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#DC2626]" />
              <span>Depot Delivery Point & Address</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <span className="text-neutral-500 block text-[11px]">Full Delivery Address</span>
                <span className="font-semibold text-neutral-900 mt-0.5 block">
                  {dealer.address || '—'}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">City / Town</span>
                <span className="font-semibold text-neutral-900 mt-0.5 block">{dealer.city}</span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">State & PIN Code</span>
                <span className="font-semibold text-neutral-900 mt-0.5 block">
                  {dealer.state} {dealer.pincode ? `• PIN: ${dealer.pincode}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Lifetime Commercial Metrics */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6] text-xs font-bold text-[#111827] uppercase tracking-wider">
              <Award className="w-4 h-4 text-[#DC2626]" />
              <span>Commercial Ledger & Rewards</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-neutral-500 block text-[11px]">Lifetime Purchases</span>
                <span className="font-bold text-neutral-900 font-mono mt-0.5 block">
                  ₹{(dealer.totalPurchases || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">Reward Points Balance</span>
                <span className="font-bold text-emerald-700 font-mono mt-0.5 block">
                  ₹{(dealer.availableRewards || 0).toLocaleString('en-IN')} Pts
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">Plumber Reward Network</span>
                <span className="font-bold text-purple-700 font-mono mt-0.5 block">
                  {dealer.plumbersCount || 0} Registered
                </span>
              </div>

              {(dealer.pendingPlumberRewards || 0) > 0 && (
                <div>
                  <span className="text-amber-800 block text-[11px] font-semibold">Plumber Escrow (Held)</span>
                  <span className="font-bold text-amber-900 font-mono mt-0.5 block">
                    ₹{(dealer.pendingPlumberRewards || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {cleanPhone.length >= 10 && (
              <a
                href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(dealer.ownerName || dealer.name)}%2C%20FILTEC%20Commercial%20Update.`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            <Link
              href={`/admin/orders?q=${encodeURIComponent(dealer.name)}`}
              onClick={onClose}
              className="bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-neutral-600" />
              <span>Orders ({dealer.name.slice(0, 14)}...)</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(dealer);
                }}
                className="bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
