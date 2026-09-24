'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Dealer } from '@/types';
import {
  Search,
  ChevronDown,
  X,
  Check,
  Building2,
  MapPin,
  Phone,
  CreditCard
} from 'lucide-react';

interface DealerSearchComboboxProps {
  dealers: Dealer[];
  selectedDealerId: string | null | undefined;
  onSelectDealer: (dealer: Dealer) => void;
  className?: string;
  placeholder?: string;
}

export function DealerSearchCombobox({
  dealers,
  selectedDealerId,
  onSelectDealer,
  className = '',
  placeholder = 'Search & select authorized dealer...'
}: DealerSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedDealer = useMemo(() => {
    return dealers.find((d) => d.id === selectedDealerId) || null;
  }, [dealers, selectedDealerId]);

  // Extract unique districts with counts
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dealers.forEach((d) => {
      const dist = d.city || 'Other';
      counts[dist] = (counts[dist] || 0) + 1;
    });
    return counts;
  }, [dealers]);

  const topDistricts = useMemo(() => {
    return Object.entries(districtCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [districtCounts]);

  // Filter dealers based on search text and district filter
  const filteredDealers = useMemo(() => {
    let list = dealers;

    if (selectedDistrict !== 'ALL') {
      list = list.filter((d) => (d.city || '').toLowerCase() === selectedDistrict.toLowerCase());
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const digitQ = q.replace(/\D/g, '');
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.city && d.city.toLowerCase().includes(q)) ||
          (d.code && d.code.toLowerCase().includes(q)) ||
          (d.phone && (d.phone.toLowerCase().includes(q) || (digitQ && d.phone.replace(/\D/g, '').includes(digitQ)))) ||
          (d.address && d.address.toLowerCase().includes(q))
      );
    }

    return list;
  }, [dealers, search, selectedDistrict]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
      setSelectedDistrict('ALL');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (dealer: Dealer) => {
    onSelectDealer(dealer);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Combobox Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 shadow-2xs ${
          isOpen
            ? 'border-[#DC2626] ring-2 ring-[#DC2626]/10 bg-white'
            : 'border-[#E5E7EB] bg-white hover:border-neutral-400 hover:bg-[#F9FAFB]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-600">
            <Building2 className="w-4 h-4" />
          </div>

          {selectedDealer ? (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-[#111827] truncate">
                  {selectedDealer.name}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-[#4B5563] text-[10px] font-mono font-medium">
                  {selectedDealer.code}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-red-50 text-[#DC2626] text-[10px] font-medium flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {selectedDealer.city}
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                {selectedDealer.address} • 📞 {selectedDealer.phone}
              </p>
            </div>
          ) : (
            <span className="text-xs text-[#9CA3AF] font-medium">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-neutral-400">
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#DC2626]' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Floating Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2.5 bg-[#F9FAFB] border-b border-[#F3F4F6] space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type dealer name, district, code (e.g. DLR-015), or phone..."
                className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#DC2626] focus:border-[#DC2626]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-700 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick District Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10px]">
              <button
                type="button"
                onClick={() => setSelectedDistrict('ALL')}
                className={`px-2 py-0.5 rounded-full font-medium transition-colors shrink-0 ${
                  selectedDistrict === 'ALL'
                    ? 'bg-[#111827] text-white'
                    : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-neutral-100'
                }`}
              >
                All ({dealers.length})
              </button>
              {topDistricts.map(([dist, count]) => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setSelectedDistrict(dist)}
                  className={`px-2 py-0.5 rounded-full font-medium transition-colors shrink-0 ${
                    selectedDistrict.toLowerCase() === dist.toLowerCase()
                      ? 'bg-[#DC2626] text-white'
                      : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-neutral-100'
                  }`}
                >
                  {dist} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="px-3 py-1.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between text-[10px] font-mono text-neutral-500">
            <span>
              Showing {filteredDealers.length} of {dealers.length} dealers
            </span>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedDistrict('ALL');
                }}
                className="text-[#DC2626] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Scrollable Dealer Items List (Controlled Max Height) */}
          <div className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-[#F3F4F6]">
            {filteredDealers.length > 0 ? (
              filteredDealers.map((dealer) => {
                const isSelected = selectedDealer?.id === dealer.id;

                return (
                  <button
                    key={dealer.id}
                    type="button"
                    onClick={() => handleSelect(dealer)}
                    className={`w-full text-left p-2.5 sm:p-3 transition-colors flex items-center justify-between gap-3 group ${
                      isSelected
                        ? 'bg-red-50/70 hover:bg-red-50'
                        : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`font-semibold text-xs ${
                            isSelected ? 'text-[#DC2626]' : 'text-[#111827] group-hover:text-[#DC2626]'
                          }`}
                        >
                          {dealer.name}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                          {dealer.code}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium">
                          {dealer.tier}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[#6B7280]">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="font-medium text-[#111827]">{dealer.city}</span>
                          {dealer.address && dealer.address !== dealer.city && (
                            <span className="text-[#9CA3AF] truncate">({dealer.address})</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1 font-mono shrink-0">
                          <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                          {dealer.phone}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[10px] font-mono font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 hidden sm:inline-block">
                        {dealer.city}
                      </span>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#DC2626] text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-neutral-200 group-hover:border-[#DC2626] flex items-center justify-center transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 px-4 text-center">
                <Building2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-neutral-800">No dealers found</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  No dealer matching &quot;{search}&quot; in{' '}
                  {selectedDistrict === 'ALL' ? 'all districts' : selectedDistrict}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedDistrict('ALL');
                  }}
                  className="mt-3 text-xs font-medium text-[#DC2626] hover:underline"
                >
                  Reset filters & view all {dealers.length} dealers
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
