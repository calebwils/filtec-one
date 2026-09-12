'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { ProductCard } from '@/components/catalogue/ProductCard';
import { useAppStore } from '@/data/store';
import { ProductCategory, MaterialType, Product } from '@/types';
import {
  Search,
  Filter,
  X,
  ShoppingBag,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  Download,
  BookOpen
} from 'lucide-react';

export default function CataloguePage() {
  const { products, cart } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedStandard, setSelectedStandard] = useState<string>('all');

  // Multi-attribute search matching codes, names, sizes, materials, tags
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
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

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = product.code.toLowerCase().includes(query);
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesMaterial = product.material.toLowerCase().includes(query);
        const matchesStandard = product.standard.toLowerCase().includes(query);
        const matchesSizeMm = product.sizeMm?.toLowerCase().includes(query) || false;
        const matchesSizeInch = product.sizeInch?.toLowerCase().includes(query) || false;
        const matchesTags = product.tags.some((t) => t.toLowerCase().includes(query));

        // Intelligent synonyms (e.g. 'one inch' -> '1"', 'tape' -> 'teflon')
        const matchesSynonyms =
          (query.includes('one inch') && (product.sizeInch?.includes('1"') || product.tags.includes('1 inch'))) ||
          (query.includes('half inch') && (product.sizeInch?.includes('1/2"') || product.tags.includes('1/2 inch'))) ||
          (query.includes('hot water') && product.material === 'CPVC');

        if (
          !matchesCode &&
          !matchesName &&
          !matchesCategory &&
          !matchesMaterial &&
          !matchesStandard &&
          !matchesSizeMm &&
          !matchesSizeInch &&
          !matchesTags &&
          !matchesSynonyms
        ) {
          return false;
        }
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedMaterial, selectedStandard]);

  const cartTotalAmount = cart.items.reduce((acc, i) => acc + i.totalAmount, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Product Catalogue" subtitle="Official FILTEC Reference" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* CLEAN MINIMALIST CATALOGUE HEADER */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#111827]">
              Product Catalogue
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Official technical specifications and wholesale price list
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
              placeholder="Search by code (F-3, F-42), size (25mm, 1 inch), standard (SCH-40, SDR-11), CPVC..."
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

          {/* Category Tabs */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#111827] text-white font-semibold'
                  : 'bg-neutral-100 text-[#4B5563] hover:bg-neutral-200'
              }`}
            >
              All Products ({products.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('pipes')}
              className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-all ${
                selectedCategory === 'pipes'
                  ? 'bg-[#111827] text-white font-semibold'
                  : 'bg-neutral-100 text-[#4B5563] hover:bg-neutral-200'
              }`}
            >
              Pipes
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('fittings')}
              className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-all ${
                selectedCategory === 'fittings'
                  ? 'bg-[#111827] text-white font-semibold'
                  : 'bg-neutral-100 text-[#4B5563] hover:bg-neutral-200'
              }`}
            >
              Fittings
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('valves')}
              className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-all ${
                selectedCategory === 'valves'
                  ? 'bg-[#111827] text-white font-semibold'
                  : 'bg-neutral-100 text-[#4B5563] hover:bg-neutral-200'
              }`}
            >
              Ball Valves
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('solvents')}
              className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-all ${
                selectedCategory === 'solvents'
                  ? 'bg-[#111827] text-white font-semibold'
                  : 'bg-neutral-100 text-[#4B5563] hover:bg-neutral-200'
              }`}
            >
              Heavy Duty Solvents
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('tape')}
              className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-all ${
                selectedCategory === 'tape'
                  ? 'bg-[#111827] text-white font-semibold'
                  : 'bg-neutral-100 text-[#4B5563] hover:bg-neutral-200'
              }`}
            >
              PTFE Teflon Tape
            </button>
          </div>

          {/* Material Sub-filters */}
          <div className="mt-2.5 pt-2.5 border-t border-[#F3F4F6] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] uppercase font-mono text-[#9CA3AF]">Material:</span>
            {['all', 'uPVC', 'CPVC', 'PTFE'].map((mat) => (
              <button
                key={mat}
                type="button"
                onClick={() => setSelectedMaterial(mat)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                  selectedMaterial === mat
                    ? 'bg-[#DC2626] text-white font-semibold'
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

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs text-[#6B7280] px-1">
          <span>
            Showing <strong className="text-[#111827]">{filteredProducts.length}</strong> products
          </span>
          <span className="text-[11px] font-mono">Catalog: 01.07.2026 Edition</span>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-10 text-center">
            <SlidersHorizontal className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <h4 className="font-semibold text-sm text-[#111827]">No products matched your search</h4>
            <p className="text-xs text-[#6B7280] mt-1">
              Try searching by product code (e.g. F-3, F-42) or broad terms like 'pipe', 'valve', or 'solvent'.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedMaterial('all');
                setSelectedStandard('all');
              }}
              className="mt-3 text-xs text-[#DC2626] font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

      {/* Floating Cart Sticky Bar (Mobile thumb optimized) */}
      {cart.items.length > 0 && (
        <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 max-w-lg mx-auto z-40">
          <div className="bg-[#111827] text-white rounded-xl p-3.5 shadow-2xl flex items-center justify-between border border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#DC2626] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                {cart.items.length}
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono">
                  ₹{cartTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {cart.items.length} items in field order
                </div>
              </div>
            </div>

            <Link
              href="/employee/orders/new"
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>Review Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
