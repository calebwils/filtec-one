'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { ProductCard } from '@/components/catalogue/ProductCard';
import { DealerCheckoutModal } from '@/components/orders/DealerCheckoutModal';
import { useAppStore } from '@/data/store';
import { sortProductsNaturally, matchesProductSearch } from '@/lib/catalogueUtils';
import {
  Search,
  Download,
  FileText,
  X,
  ShoppingBag,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  Layers,
  BookOpen
} from 'lucide-react';

export default function DealerCataloguePage() {
  const { products, cart, dealers, currentUser } = useAppStore();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const currentDealer =
    dealers.find((d) => d.id === currentUser.dealerId) || dealers[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedStandard, setSelectedStandard] = useState<string>('all');

  // Filter products
  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      if (product.isArchived) return false;

      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      // Material filter
      if (selectedMaterial !== 'all' && product.material !== selectedMaterial) {
        return false;
      }
      // Standard filter
      if (selectedStandard !== 'all' && !product.standard.includes(selectedStandard)) {
        return false;
      }

      return matchesProductSearch(product, searchQuery);
    });

    return sortProductsNaturally(list);
  }, [products, searchQuery, selectedCategory, selectedMaterial, selectedStandard]);

  const cartTotalAmount = cart.items.reduce((acc, i) => acc + i.totalAmount, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar
        title="Product Catalogue"
        subtitle={`Official FILTEC Reference • ${currentDealer?.name || 'Authorized Dealer'}`}
      />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* CLEAN MINIMALIST CATALOGUE HEADER */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#111827]">
              Product Catalogue
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Official technical specifications and packaging directory
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/api/catalogue/download"
              download="FILTEC_CATALOGUE_01.07.2026.pdf"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#111827] hover:bg-black text-white transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Catalogue</span>
            </a>

            <a
              href="/catalogues/FILTEC_CATALOGUE_01.07.2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-[#111827] transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>View in Browser</span>
            </a>
          </div>
        </div>

        {/* Search Bar & Smart Input */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by code (e.g. F1, F42), name, size (25mm, 1 inch), standard (SCH-40, SDR-11)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#E5E7EB] text-xs focus:outline-none focus:ring-1 focus:ring-[#DC2626] bg-[#F9FAFB]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { id: 'all', label: `All Products (${products.length})` },
              { id: 'pipes', label: 'Pipes' },
              { id: 'fittings', label: 'Fittings' },
              { id: 'valves', label: 'Ball Valves' },
              { id: 'solvents', label: 'Heavy Duty Solvents' },
              { id: 'tape', label: 'PTFE Teflon Tape' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#111827] text-white font-semibold'
                    : 'bg-neutral-100 text-[#4B5563] hover:bg-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Material & Standard Sub-filters */}
          <div className="mt-2.5 pt-2.5 border-t border-[#F3F4F6] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] uppercase font-mono text-[#9CA3AF]">Material:</span>
            {['all', 'uPVC', 'CPVC', 'PTFE'].map((mat) => (
              <button
                key={mat}
                type="button"
                onClick={() => setSelectedMaterial(mat)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                  selectedMaterial === mat
                    ? 'bg-[#111827] text-white font-semibold'
                    : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-neutral-400'
                }`}
              >
                {mat === 'all' ? 'All Materials' : mat}
              </button>
            ))}

            <span className="text-[10px] uppercase font-mono text-[#9CA3AF] ml-2">Standard:</span>
            {['all', 'SCH-40', 'SCH-80', 'SDR-11'].map((std) => (
              <button
                key={std}
                type="button"
                onClick={() => setSelectedStandard(std)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                  selectedStandard === std
                    ? 'bg-[#111827] text-white font-semibold'
                    : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-neutral-400'
                }`}
              >
                {std === 'all' ? 'All Standards' : std}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-[#6B7280] px-1">
          <span>
            Showing <strong className="text-[#111827]">{filteredProducts.length}</strong> products
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            F-1 to F-99
          </span>
        </div>

        {/* Product Cards Grid with Photos */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-10 text-center">
            <SlidersHorizontal className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <h4 className="font-semibold text-sm text-[#111827]">No products matched your filter</h4>
            <p className="text-xs text-[#6B7280] mt-1">
              Try searching by product code (e.g. F-1, F-42, F-98) or broad keywords like 'valve', 'pipe', or 'cpvc'.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedMaterial('all');
                setSelectedStandard('all');
              }}
              className="mt-3 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Sticky Cart Summary Bar (if dealer has items in requisition draft) */}
        {cart.items.length > 0 && (
          <div className="fixed bottom-14 md:bottom-6 left-4 right-4 max-w-2xl mx-auto z-40 animate-in slide-in-from-bottom-3 duration-200">
            <div className="bg-[#111827] text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#DC2626] flex items-center justify-center font-mono font-bold text-xs">
                  {cart.items.length}
                </div>
                <div>
                  <div className="text-xs font-semibold">Wholesale Order Draft</div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    {cart.items.reduce((sum, item) => sum + item.quantity, 0)} Total Units Booked
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Review Requisition</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      <DealerCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <MobileBottomNav />
    </div>
  );
}
