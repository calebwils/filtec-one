'use client';

import React, { useState, useMemo } from 'react';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore, store } from '@/data/store';
import { Product } from '@/types';
import { sortProductsNaturally, formatProductCode, matchesProductSearch } from '@/lib/catalogueUtils';
import { AddProductModal } from '@/components/admin/AddProductModal';
import { EditProductModal } from '@/components/admin/EditProductModal';
import { ProductImageModal } from '@/components/catalogue/ProductImageModal';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  ArrowUpDown,
  Archive,
  Download,
  BookOpen,
  Maximize2
} from 'lucide-react';

export default function AdminCataloguePage() {
  const { products } = useAppStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedPhotoProduct, setSelectedPhotoProduct] = useState<Product | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Active unarchived products
  const activeProducts = products.filter((p) => !p.isArchived);

  const inStockCount = activeProducts.filter((p) => p.inStock !== false).length;
  const outOfStockCount = activeProducts.filter((p) => p.inStock === false).length;

  const filteredProducts = useMemo(() => {
    const matched = activeProducts.filter((p) => {
      const matchesSearch = matchesProductSearch(p, search);
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'IN_STOCK' && p.inStock !== false) ||
        (stockFilter === 'OUT_OF_STOCK' && p.inStock === false);

      return matchesSearch && matchesCategory && matchesStock;
    });
    return sortProductsNaturally(matched);
  }, [activeProducts, search, categoryFilter, stockFilter]);

  const handleToggleStock = (p: Product) => {
    const nextState = !(p.inStock !== false);
    store.toggleProductStock(p.id, nextState);
    setActionNotice(
      `${p.code} is now marked ${nextState ? 'IN STOCK (Available in Field App)' : 'OUT OF STOCK (Disabled in Field App)'}`
    );
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleToggleVariantStock = (p: Product, variantId: string, currentStock?: boolean) => {
    const nextState = !(currentStock !== false);
    store.toggleVariantStock(p.id, variantId, nextState);
  };

  const handleDeleteProduct = (p: Product) => {
    if (confirm(`Are you sure you want to delete or archive ${p.code} (${p.name})?`)) {
      const res = store.deleteProduct(p.id);
      setActionNotice(res.message);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Catalogue Management" subtitle="Stock Availability & Products Master" />
      <DesktopSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Banner Alert Toast */}
        {actionNotice && (
          <div className="bg-[#111827] text-white p-3 rounded-xl flex items-center justify-between text-xs shadow-md border border-neutral-700 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-neutral-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Header & Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">
              Product Catalogue & Warehouse Stock
            </h2>
            <p className="text-xs text-[#6B7280]">
              Control real-time product availability for field sales reps and authorized dealers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/catalogue/download"
              download="FILTEC_CATALOGUE_01.07.2026.pdf"
              className="bg-neutral-900 hover:bg-black text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs border border-neutral-700"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>Download 2026 PDF (46 MB)</span>
            </a>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Product</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Catalogue SKUs</span>
            <div className="text-xl font-bold font-mono text-[#111827] mt-0.5">{activeProducts.length}</div>
            <span className="text-[10px] text-[#6B7280]">F1 to F99 active items</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-emerald-700 block">Available in Stock</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{inStockCount}</div>
            <span className="text-[10px] text-emerald-600">Available for live booking</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-rose-700 block">Out of Stock</span>
            <div className="text-xl font-bold font-mono text-[#DC2626] mt-0.5">{outOfStockCount}</div>
            <span className="text-[10px] text-[#DC2626]">Disabled in order builder</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
            <span className="text-[10px] uppercase font-mono text-[#6B7280] block">Factory Fulfillment</span>
            <div className="text-xl font-bold font-mono text-[#111827] mt-0.5">
              {Math.round((inStockCount / (activeProducts.length || 1)) * 100)}%
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">Ready for dispatch</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code (F-1..F-99), size (25mm), material..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              />
            </div>

            {/* Stock Toggle Filters */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-500 text-[11px] mr-1">Stock Status:</span>
              <button
                type="button"
                onClick={() => setStockFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                  stockFilter === 'ALL'
                    ? 'bg-[#111827] text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-[#4B5563]'
                }`}
              >
                All ({activeProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('IN_STOCK')}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                  stockFilter === 'IN_STOCK'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                }`}
              >
                In Stock ({inStockCount})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('OUT_OF_STOCK')}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                  stockFilter === 'OUT_OF_STOCK'
                    ? 'bg-[#DC2626] text-white'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
                }`}
              >
                Out of Stock ({outOfStockCount})
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#F3F4F6] text-xs">
            {['ALL', 'pipes', 'fittings', 'valves', 'solvents', 'tape'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-[#6B7280]'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Roster Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] uppercase font-mono text-[10px]">
                  <th className="py-3 px-3 w-14 text-center">Photo</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Product Name & Standard</th>
                  <th className="py-3 px-4">Category / Material</th>
                  <th className="py-3 px-4">Variants / Packaging</th>
                  <th className="py-3 px-4">Stock Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filteredProducts.map((p) => {
                  const isAvailable = p.inStock !== false;
                  const isExpanded = expandedProductId === p.id;

                  return (
                    <React.Fragment key={p.id}>
                      <tr className={`hover:bg-neutral-50/80 transition-colors ${!isAvailable ? 'bg-rose-50/20' : ''}`}>
                        {/* Photo Thumbnail */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedPhotoProduct(p)}
                            className="w-11 h-11 mx-auto rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center p-1 group hover:border-neutral-400 transition-all relative cursor-pointer"
                            title="Click to zoom product photo"
                          >
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform"
                                loading="lazy"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-neutral-400" />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                              <Maximize2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        </td>

                        {/* Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-xs">
                          <span className="bg-[#111827] text-white px-2 py-0.5 rounded whitespace-nowrap">
                            {formatProductCode(p.code)}
                          </span>
                        </td>

                        {/* Name & Standard */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-xs text-[#111827]">{p.name}</div>
                          <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">
                            {p.standard} {p.packingSummary && `• ${p.packingSummary}`}
                          </div>
                        </td>

                        {/* Category / Material */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="capitalize font-medium text-neutral-800">{p.category}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                              {p.material}
                            </span>
                          </div>
                          {p.sizeMm && (
                            <span className="text-[10px] text-neutral-500 block font-mono mt-0.5">
                              {p.sizeMm} {p.sizeInch && `(${p.sizeInch})`}
                            </span>
                          )}
                        </td>

                        {/* Variants & Packaging */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-xs text-[#111827]">
                            {p.packingSummary || `${p.variants.length} Size Variant(s)`}
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                            className="text-[10px] text-[#DC2626] hover:underline flex items-center gap-0.5 mt-0.5 font-medium"
                          >
                            <span>{p.variants.length} Size Variant(s)</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>

                        {/* 1-Click Stock Toggle */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStock(p)}
                              title="Click to toggle stock status"
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isAvailable ? 'bg-emerald-600' : 'bg-neutral-300'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  isAvailable ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                                isAvailable
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isAvailable ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingProduct(p)}
                              title="Edit product details & pricing"
                              className="p-1.5 text-neutral-500 hover:text-[#111827] hover:bg-neutral-100 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              title="Delete or archive SKU"
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Variant Sub-Row */}
                      {isExpanded && (
                        <tr className="bg-neutral-50/60 border-b border-[#E5E7EB]">
                          <td colSpan={7} className="p-3 pl-12">
                            <div className="bg-white rounded-lg border border-[#E5E7EB] p-3 space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-[#111827] border-b pb-1.5">
                                <span>Variant Diameters & Specific Availability</span>
                                <span className="text-[10px] text-neutral-500">Toggle individual sizes</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {p.variants.map((v) => {
                                  const vAvailable = v.inStock !== false;
                                  return (
                                    <div
                                      key={v.id}
                                      className="flex items-center justify-between p-2 rounded border border-neutral-200 bg-[#F9FAFB] text-xs"
                                    >
                                      <div>
                                        <span className="font-semibold text-[#111827] block">
                                          {v.size || v.length || 'Standard'}
                                        </span>
                                        <span className="font-mono text-[10px] text-neutral-500">
                                          Standard Packing: {v.packingQty} {v.packingUnit}
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleToggleVariantStock(p, v.id, v.inStock)}
                                        className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border transition-colors ${
                                          vAvailable
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                        }`}
                                      >
                                        {vAvailable ? 'IN STOCK' : 'OUT'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newP) => {
          setActionNotice(`New product ${newP.code} added to catalogue successfully!`);
          setTimeout(() => setActionNotice(null), 3500);
        }}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={() => {
          setActionNotice(`Product updated successfully!`);
          setTimeout(() => setActionNotice(null), 3500);
        }}
      />

      {/* Product Image & Specs Modal */}
      <ProductImageModal
        product={selectedPhotoProduct}
        isOpen={!!selectedPhotoProduct}
        onClose={() => setSelectedPhotoProduct(null)}
      />
    </div>
  );
}
