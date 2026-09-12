'use client';

import React, { useState } from 'react';
import {
  X,
  PackagePlus,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Layers,
  Box,
  Tag
} from 'lucide-react';
import { useAppStore, store } from '@/data/store';
import { ProductCategory, MaterialType, Product } from '@/types';

interface VariantDraft {
  id: string;
  size?: string;
  length?: string;
  mrp: number;
  packingQty: number;
  packingUnit: string;
}

export function AddProductModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (p: Product) => void;
}) {
  const { products } = useAppStore();

  // Suggest next code F-XX
  const nextNum = products.reduce((max, p) => {
    const match = p.code.match(/F-(\d+)/i);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 99) + 1;

  const [code, setCode] = useState(`F-${nextNum}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('valves');
  const [material, setMaterial] = useState<MaterialType>('CPVC');
  const [standard, setStandard] = useState('SDR-11 (ASTM D2846)');
  const [sizeMm, setSizeMm] = useState('25 mm');
  const [sizeInch, setSizeInch] = useState('1"');
  const [application, setApplication] = useState('Hot and cold water distribution, industrial plumbing');
  const [moq, setMoq] = useState(20);
  const [packingSummary, setPackingSummary] = useState('Box of 20 pcs / Master Carton 120 pcs');
  const [inStock, setInStock] = useState(true);

  // Dynamic variants
  const [variants, setVariants] = useState<VariantDraft[]>([
    {
      id: 'var-1',
      size: '25 mm (1")',
      length: 'Standard',
      mrp: 385.00,
      packingQty: 20,
      packingUnit: 'Pcs'
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: `var-${Date.now()}`,
        size: '',
        length: 'Standard',
        mrp: 450.00,
        packingQty: 20,
        packingUnit: 'Pcs'
      }
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof VariantDraft, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || variants.length === 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const created = store.addProduct({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        material,
        standard: standard.trim(),
        sizeMm: sizeMm.trim() || undefined,
        sizeInch: sizeInch.trim() || undefined,
        application: application.trim(),
        moq: Number(moq) || 1,
        packingSummary: packingSummary.trim(),
        tags: [code, category, material, standard, sizeMm, sizeInch].filter(Boolean),
        inStock,
        stockStatus: inStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
        variants: variants.map((v, idx) => ({
          id: `${code.toLowerCase()}-${idx + 1}`,
          productId: code.toLowerCase(),
          size: v.size || undefined,
          length: v.length || undefined,
          mrp: Number(v.mrp) || 0,
          packingQty: Number(v.packingQty) || 1,
          packingUnit: v.packingUnit || 'Pcs',
          inStock
        }))
      });

      setIsSubmitting(false);
      onSuccess(created);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#DC2626] text-white flex items-center justify-center shadow-xs">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827]">
                Add New Catalogue Product
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Configure product SKU, standard specifications, MRP price variants, and warehouse stock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 1. Identification & Standards */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 pb-1 border-b border-[#F3F4F6]">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
              <h4 className="text-xs font-bold uppercase font-mono text-[#111827]">
                1. Product Identification & Standard
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Product Code <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="F-100"
                  className="w-full p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-mono font-bold text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Product Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 25 MM (1) CPVC Concealed Valve"
                  className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                >
                  <option value="pipes">Pipes</option>
                  <option value="fittings">Fittings</option>
                  <option value="valves">Valves</option>
                  <option value="solvents">Solvents</option>
                  <option value="tape">PTFE Tape</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Material
                </label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value as MaterialType)}
                  className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                >
                  <option value="uPVC">uPVC</option>
                  <option value="CPVC">CPVC</option>
                  <option value="PTFE">PTFE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Standard Specification
                </label>
                <input
                  type="text"
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                  placeholder="e.g. SDR-11 (ASTM D2846)"
                  className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Nominal Size (mm)
                </label>
                <input
                  type="text"
                  value={sizeMm}
                  onChange={(e) => setSizeMm(e.target.value)}
                  placeholder="25 mm"
                  className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Nominal Size (Inch)
                </label>
                <input
                  type="text"
                  value={sizeInch}
                  onChange={(e) => setSizeInch(e.target.value)}
                  placeholder="1 inch"
                  className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Initial Stock Availability
                </label>
                <select
                  value={inStock ? 'IN' : 'OUT'}
                  onChange={(e) => setInStock(e.target.value === 'IN')}
                  className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                >
                  <option value="IN">In Stock (Available to Order)</option>
                  <option value="OUT">Out of Stock (Disabled in App)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Commercial Application & Benefits
              </label>
              <input
                type="text"
                value={application}
                onChange={(e) => setApplication(e.target.value)}
                placeholder="Key application features..."
                className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
              />
            </div>
          </div>

          {/* 2. Variants & MRP Pricing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                <h4 className="text-xs font-bold uppercase font-mono text-[#111827]">
                  2. Sizing Variants & Catalogue MRP (₹)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="text-xs font-semibold text-[#DC2626] hover:text-[#B91C1C] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end text-xs"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#111827] mb-1">
                      Variant / Length / Size
                    </label>
                    <input
                      type="text"
                      required
                      value={variant.size || variant.length || ''}
                      onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                      placeholder="e.g. 25 mm (1) or 3 Mtr"
                      className="w-full p-2 bg-white border border-[#E5E7EB] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#111827] mb-1">
                      Catalogue MRP (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={variant.mrp}
                      onChange={(e) => handleVariantChange(index, 'mrp', parseFloat(e.target.value))}
                      className="w-full p-2 bg-white border border-[#E5E7EB] rounded-lg font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#111827] mb-1">
                      Packing Qty & Unit
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={variant.packingQty}
                        onChange={(e) => handleVariantChange(index, 'packingQty', parseInt(e.target.value, 10))}
                        className="w-14 p-2 bg-white border border-[#E5E7EB] rounded-lg font-mono"
                      />
                      <select
                        value={variant.packingUnit}
                        onChange={(e) => handleVariantChange(index, 'packingUnit', e.target.value)}
                        className="flex-1 p-2 bg-white border border-[#E5E7EB] rounded-lg"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Box">Box</option>
                        <option value="Bundle">Bundle</option>
                        <option value="Tin">Tin</option>
                        <option value="Roll">Roll</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="p-2 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-neutral-200 transition-colors"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Commercial Packing & MOQ */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 pb-1 border-b border-[#F3F4F6]">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
              <h4 className="text-xs font-bold uppercase font-mono text-[#111827]">
                3. Commercial Packing & Minimum Order
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Master Packing Summary
                </label>
                <input
                  type="text"
                  value={packingSummary}
                  onChange={(e) => setPackingSummary(e.target.value)}
                  placeholder="e.g. 40 Pcs (Box) / 240 Pcs (Master Carton)"
                  className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Minimum Order Quantity (MOQ in pcs)
                </label>
                <input
                  type="number"
                  value={moq}
                  onChange={(e) => setMoq(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Adding Product...' : 'Publish Product to Live Catalogue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
