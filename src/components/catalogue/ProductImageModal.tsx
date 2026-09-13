'use client';

import React, { useEffect } from 'react';
import { Product } from '@/types';
import { X, Check, ShieldCheck, Download, Package, Layers } from 'lucide-react';
import { formatProductCode } from '@/lib/catalogueUtils';

interface ProductImageModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductImageModal({ product, isOpen, onClose }: ProductImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-150 bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs bg-[#111827] text-white px-2.5 py-1 rounded whitespace-nowrap">
              {formatProductCode(product.code)}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                product.material === 'CPVC'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : product.material === 'uPVC'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-neutral-100 text-neutral-800 border-neutral-200'
              }`}
            >
              {product.material}
            </span>
            <span className="text-xs font-mono text-neutral-500">
              {product.standard}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Photo Display Stage */}
          <div className="relative w-full h-64 sm:h-72 rounded-xl bg-gradient-to-b from-neutral-50 via-white to-neutral-100/60 border border-neutral-200/80 flex items-center justify-center p-6 overflow-hidden">
            <img
              src={
                product.imageUrl ||
                (product.category === 'valves'
                  ? product.material === 'CPVC'
                    ? '/images/products/cpvc-ball-valve.png'
                    : '/images/products/upvc-ball-valve.png'
                  : product.category === 'solvents'
                  ? product.material === 'CPVC'
                    ? '/images/products/solvent-tin-cvpc.png'
                    : '/images/products/solvent-tin-cvp.png'
                  : product.category === 'tape'
                  ? '/images/products/teflon-tape-10m.png'
                  : product.category === 'fittings'
                  ? product.material === 'CPVC'
                    ? '/images/products/cpvc-elbow.png'
                    : '/images/products/upvc-elbow.png'
                  : product.material === 'CPVC'
                  ? '/images/products/cpvc-pipe-sdr11.png'
                  : product.standard?.includes('80')
                  ? '/images/products/upvc-pipe-sch80.png'
                  : '/images/products/upvc-pipe-sch40.png')
              }
              alt={product.name}
              className="max-h-full max-w-full object-contain filter drop-shadow-lg transition-transform hover:scale-105 duration-300"
            />
            <div className="absolute bottom-3 right-3 text-[10px] font-mono text-neutral-400 bg-white/80 px-2 py-0.5 rounded backdrop-blur-xs border border-neutral-200">
              Product Photo
            </div>
          </div>

          {/* Product Title & Details */}
          <div>
            <h2 className="text-lg font-bold text-neutral-900 leading-tight">
              {product.name}
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              {product.application}
            </p>
          </div>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs">
            {product.sizeMm && (
              <div>
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">Metric Size</span>
                <span className="font-semibold text-neutral-900">{product.sizeMm}</span>
              </div>
            )}
            {product.sizeInch && (
              <div>
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">Inch Size</span>
                <span className="font-semibold text-neutral-900">{product.sizeInch}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">Category</span>
              <span className="font-semibold capitalize text-neutral-900">{product.category}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">Standard</span>
              <span className="font-semibold text-neutral-900">{product.standard}</span>
            </div>
          </div>

          {/* Variants & Pricing Table */}
          {product.variants && product.variants.length > 0 && (
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <div className="bg-neutral-100/70 px-3.5 py-2 text-xs font-semibold text-neutral-800 border-b border-neutral-200 flex items-center justify-between">
                <span>Catalogue Specifications & Packing</span>
                <span className="text-[10px] font-mono font-normal text-neutral-500">
                  {product.variants.length} Specification Variant{product.variants.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-500 border-b border-neutral-200">
                    <tr>
                      <th className="py-2 px-3">Variant / Size</th>
                      <th className="py-2 px-3">Standard Packing</th>
                      <th className="py-2 px-3 text-right">Catalogue Rate (₹)</th>
                      <th className="py-2 px-3 text-right">Lot Total (₹)</th>
                      <th className="py-2 px-3 text-right">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-150">
                    {product.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-neutral-50/60">
                        <td className="py-2 px-3 font-medium text-neutral-900">
                          {v.length || v.size || 'Standard'}
                        </td>
                        <td className="py-2 px-3 font-mono text-neutral-600">
                          {v.packingQty} {v.packingUnit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[#DC2626]">
                          ₹{v.mrp.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-neutral-700">
                          ₹{(v.mrp * v.packingQty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                            v.inStock !== false
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {v.inStock !== false ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="flex items-center justify-between pt-2 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Genuine Pretech Filtec Products
            </span>
            <a
              href="/catalogues/FILTEC_CATALOGUE_01.07.2026.pdf"
              download="FILTEC_CATALOGUE_01.07.2026.pdf"
              className="inline-flex items-center gap-1 text-[#DC2626] hover:underline font-medium"
            >
              <Download className="w-3 h-3" />
              Download Full PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
