'use client';

import React, { useState } from 'react';
import { Product, ProductVariant } from '@/types';
import { store } from '@/data/store';
import { Plus, Check, Info, Package, Shield, Maximize2 } from 'lucide-react';
import { ProductImageModal } from './ProductImageModal';

export function ProductCard({
  product,
  onOpenDetails
}: {
  product: Product;
  onOpenDetails?: (product: Product) => void;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ''
  );
  const [quantityMultiplier, setQuantityMultiplier] = useState<number>(1);
  const [justAdded, setJustAdded] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const isOutOfStock = product.inStock === false || selectedVariant?.inStock === false;

  const totalQuantity = (selectedVariant?.packingQty || 1) * quantityMultiplier;
  const totalPrice = Number(((selectedVariant?.mrp || 0) * quantityMultiplier).toFixed(2));

  const handleAdd = () => {
    if (!selectedVariant || isOutOfStock) return;

    store.addToCart({
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      variantId: selectedVariant.id,
      variantDescription: selectedVariant.length
        ? `${selectedVariant.length} (${selectedVariant.packingQty} ${selectedVariant.packingUnit})`
        : `${selectedVariant.size || ''} (${selectedVariant.packingQty} ${selectedVariant.packingUnit})`,
      unitPrice: selectedVariant.mrp,
      quantity: totalQuantity,
      packingQty: selectedVariant.packingQty,
      packingUnit: selectedVariant.packingUnit,
      totalAmount: totalPrice
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <>
      <div
        className={`bg-white border rounded-xl p-3.5 sm:p-4 hover:border-neutral-400 transition-all flex flex-col justify-between shadow-2xs group ${
          isOutOfStock ? 'border-rose-200 bg-rose-50/10' : 'border-[#E5E7EB]'
        }`}
      >
        <div>
          {/* Top Header: Code & Category Tag */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="tech-code font-bold text-xs bg-[#111827] text-white px-2 py-0.5 rounded">
                {product.code}
              </span>
              <span
                className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded border ${
                  product.material === 'CPVC'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : product.material === 'uPVC'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-neutral-100 text-neutral-800 border-neutral-200'
                }`}
              >
                {product.material}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isOutOfStock && (
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  Out of Stock
                </span>
              )}
              <span className="text-[11px] font-mono text-[#6B7280]">
                {product.standard}
              </span>
            </div>
          </div>

          {/* Authentic Product Photo */}
          <div
            onClick={() => setIsImageModalOpen(true)}
            className="relative w-full h-36 rounded-lg bg-gradient-to-b from-neutral-50 to-neutral-100/70 border border-neutral-200/80 mb-3 flex items-center justify-center p-2.5 overflow-hidden cursor-pointer hover:border-neutral-300 transition-all"
            title="Click to zoom photo and view full specifications"
          >
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
              className="max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="bg-[#111827]/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-sm">
                <Maximize2 className="w-3 h-3" /> Zoom Photo
              </span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-sm text-[#111827] leading-snug line-clamp-2">
            {product.name}
          </h3>

          {/* Quick Specs - NO MOQ */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4B5563]">
            {product.sizeMm && (
              <div className="flex items-center gap-1">
                <span className="text-[#9CA3AF] text-[10px] uppercase font-mono">Size:</span>
                <span className="font-medium text-[#111827]">{product.sizeMm} ({product.sizeInch})</span>
              </div>
            )}
            {product.packingSummary && (
              <div className="flex items-center gap-1">
                <span className="text-[#9CA3AF] text-[10px] uppercase font-mono">Packing:</span>
                <span className="font-mono text-neutral-600">{product.packingSummary}</span>
              </div>
            )}
          </div>

          {/* Application Note */}
          <p className="mt-1.5 text-[11px] text-[#6B7280] line-clamp-1">
            {product.application}
          </p>

          {/* Variant Selection (Lengths or Sizes) */}
          {product.variants.length > 1 && (
            <div className="mt-3">
              <label className="text-[10px] uppercase font-mono text-[#6B7280] block mb-1">
                Select Specification:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {product.variants.map((variant) => {
                  const varOutOfStock = product.inStock === false || variant.inStock === false;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`px-2 py-1 rounded text-xs text-left transition-all border ${
                        selectedVariantId === variant.id
                          ? 'border-[#DC2626] bg-red-50/50 text-[#111827] font-semibold'
                          : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-neutral-300'
                      }`}
                    >
                      <div className="font-medium flex items-center justify-between">
                        <span>{variant.length || variant.size}</span>
                        {varOutOfStock && (
                          <span className="text-[9px] font-mono text-rose-600 font-bold uppercase">Out</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#6B7280] font-mono">
                        ₹{variant.mrp.toFixed(2)} ({variant.packingQty} {variant.packingUnit})
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions: Pricing & Quick Add */}
        <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block leading-none">
              Catalog MRP
            </span>
            <div className="text-base font-bold text-[#111827] font-mono leading-tight">
              ₹{selectedVariant?.mrp.toFixed(2)}
              <span className="text-[10px] text-[#6B7280] font-normal ml-1 font-sans">
                / {selectedVariant?.packingUnit || 'pc'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Packing multiplier */}
            {!isOutOfStock && (
              <div className="flex items-center border border-[#E5E7EB] rounded bg-[#F9FAFB] text-xs">
                <button
                  type="button"
                  disabled={quantityMultiplier <= 1}
                  onClick={() => setQuantityMultiplier((q) => Math.max(1, q - 1))}
                  className="px-2 py-1 text-neutral-600 hover:text-black disabled:opacity-40"
                >
                  -
                </button>
                <span className="px-2 py-1 font-mono font-semibold text-[#111827]">
                  {quantityMultiplier}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantityMultiplier((q) => q + 1)}
                  className="px-2 py-1 text-neutral-600 hover:text-black"
                >
                  +
                </button>
              </div>
            )}

            {/* Add to order button or Out of Stock button */}
            {isOutOfStock ? (
              <button
                type="button"
                disabled
                className="px-3 py-1.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed"
              >
                Out of Stock
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                  justAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#DC2626] hover:bg-[#B91C1C] text-white active:scale-97'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <ProductImageModal
        product={product}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />
    </>
  );
}
