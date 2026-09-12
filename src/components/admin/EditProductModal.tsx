'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit, Save, CheckCircle2 } from 'lucide-react';
import { store } from '@/data/store';
import { Product } from '@/types';

export function EditProductModal({
  product,
  isOpen,
  onClose,
  onSuccess
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [standard, setStandard] = useState('');
  const [moq, setMoq] = useState(1);
  const [packingSummary, setPackingSummary] = useState('');
  const [application, setApplication] = useState('');
  const [variants, setVariants] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setStandard(product.standard);
      setMoq(product.moq);
      setPackingSummary(product.packingSummary);
      setApplication(product.application);
      setVariants(product.variants.map((v) => ({ ...v })));
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleVariantPriceChange = (index: number, newPrice: number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], mrp: newPrice };
    setVariants(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      store.updateProduct(product.id, {
        name,
        standard,
        moq: Number(moq) || 1,
        packingSummary,
        application,
        variants
      });

      setIsSubmitting(false);
      onSuccess();
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 my-auto">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-[#111827] text-white px-2 py-0.5 rounded">
              {product.code}
            </span>
            <h3 className="font-bold text-sm text-[#111827]">Edit Product & Pricing</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">Standard Spec</label>
              <input
                type="text"
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">MOQ (pcs)</label>
              <input
                type="number"
                value={moq}
                onChange={(e) => setMoq(parseInt(e.target.value, 10))}
                className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Packing Summary</label>
            <input
              type="text"
              value={packingSummary}
              onChange={(e) => setPackingSummary(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Application</label>
            <input
              type="text"
              value={application}
              onChange={(e) => setApplication(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#E5E7EB] rounded-lg"
            />
          </div>

          {/* Variant Price Grid */}
          <div className="pt-2 border-t border-[#F3F4F6]">
            <span className="font-semibold block text-[#111827] mb-2">Variant Catalogue MRP (₹)</span>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={v.id || i} className="flex items-center justify-between p-2 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                  <span className="font-medium text-neutral-800">{v.size || v.length || `Variant ${i + 1}`}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-500 font-mono">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={v.mrp}
                      onChange={(e) => handleVariantPriceChange(i, parseFloat(e.target.value))}
                      className="w-24 p-1.5 bg-white border border-[#E5E7EB] rounded font-mono font-bold text-right"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Product Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
