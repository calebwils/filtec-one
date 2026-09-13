'use client';

import React, { useState } from 'react';
import { useAppStore, store } from '@/data/store';
import { Order, OrderItem } from '@/types';
import { ProformaInvoiceModal } from './ProformaInvoiceModal';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Building2,
  MapPin,
  Phone,
  FileText,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DealerCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DealerCheckoutModal({ isOpen, onClose }: DealerCheckoutModalProps) {
  const { cart, dealers, currentUser } = useAppStore();
  const [notes, setNotes] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const currentDealer = dealers.find((d) => d.id === currentUser.dealerId) || dealers[0];

  const subtotal = cart.items.reduce((sum, item) => sum + item.totalAmount, 0);
  const gstAmount = subtotal * 0.18;
  const grandTotal = subtotal + gstAmount;
  const totalUnits = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleUpdateQuantity = (item: OrderItem, delta: number) => {
    const currentQtyMultiplier = Math.max(1, Math.round(item.quantity / (item.packingQty || 1)));
    const nextMultiplier = currentQtyMultiplier + delta;
    if (nextMultiplier <= 0) {
      store.removeFromCart(item.id);
      return;
    }
    const newQty = (item.packingQty || 1) * nextMultiplier;
    store.updateCartItemQty(item.id, newQty);
  };

  const handleRemove = (itemId: string) => {
    store.removeFromCart(itemId);
  };

  const handleSubmitOrder = async () => {
    if (cart.items.length === 0) return;
    setIsSubmitting(true);

    try {
      // 1. Submit order in store
      if (notes.trim() || poNumber.trim()) {
        store.setCartNotes(`${poNumber ? `PO Ref: ${poNumber.trim()} • ` : ''}${notes.trim()}`);
      }
      const order = store.submitCurrentOrder();
      if (!order) {
        setIsSubmitting(false);
        return;
      }

      // 2. Automated dispatch to Admin endpoint
      try {
        fetch('/api/orders/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            orderNumber: order.orderNumber,
            proformaNumber: order.orderNumber.replace(/^ORD-/, 'PI-'),
            dealerName: order.dealerName,
            dealerCity: order.dealerCity,
            dealerPhone: order.dealerPhone,
            totalAmount: order.totalAmount,
            itemsCount: order.items.length,
            items: order.items,
            timestamp: new Date().toISOString()
          })
        }).catch((e) => console.warn('Admin notification async trigger:', e));
      } catch (err) {}

      // 3. Trigger celebration and show Proforma
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      setGeneratedOrder(order);
    } catch (err) {
      console.error('Failed to submit dealer order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was successfully submitted, display the Proforma Invoice
  if (generatedOrder) {
    return (
      <ProformaInvoiceModal
        order={generatedOrder}
        isOpen={true}
        onClose={() => {
          setGeneratedOrder(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:hidden">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-auto">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#DC2626] text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827]">
                Review Requisition & Generate Proforma
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Commercial order for {currentDealer?.name}
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

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Dealer Info Banner */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="font-bold text-[#111827] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>{currentDealer?.name}</span>
                <span className="font-mono text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.2 rounded">
                  {currentDealer?.code}
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-neutral-400" />
                <span>{currentDealer?.address}, {currentDealer?.city}</span>
              </div>
            </div>

            <div className="text-right sm:text-right font-mono text-[11px] text-neutral-600">
              <div>Phone: {currentDealer?.phone}</div>
              <div>State Code: 21 (Odisha)</div>
            </div>
          </div>

          {/* Cart Items List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono uppercase font-bold text-[10px] text-[#6B7280]">
                Selected Products ({cart.items.length})
              </span>
              <span className="font-mono text-[10px] text-neutral-500">
                {totalUnits} Total Units
              </span>
            </div>

            {cart.items.length > 0 ? (
              <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-150">
                {cart.items.map((item) => (
                  <div key={item.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[10px] bg-[#111827] text-white px-1.5 py-0.5 rounded">
                          {item.productCode}
                        </span>
                        <span className="font-semibold text-neutral-900 text-xs">
                          {item.productName}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        Spec: {item.variantDescription} • Rate: ₹{item.unitPrice.toFixed(2)} / {item.packingUnit}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item, -1)}
                          className="px-2 py-1 hover:bg-neutral-100 text-neutral-600 font-bold"
                          title="Decrease Lot"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 py-1 font-mono font-bold text-neutral-900 text-xs">
                          {item.quantity} {item.packingUnit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item, 1)}
                          className="px-2 py-1 hover:bg-neutral-100 text-neutral-600 font-bold"
                          title="Increase Lot"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[75px]">
                        <div className="font-mono font-bold text-neutral-900 text-xs">
                          ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-neutral-500">
                Your order requisition is empty. Select products from the catalogue.
              </div>
            )}
          </div>

          {/* Optional PO Reference & Order Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Purchase Order / PO Reference (Optional)
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-BALAJI-2026-09"
                className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Dispatch Instructions / Transport Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Direct factory vehicle preferred..."
                className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Financial Calculation Summary */}
          <div className="p-4 bg-neutral-900 text-white rounded-xl space-y-2 font-mono text-xs shadow-md">
            <div className="flex justify-between text-neutral-300">
              <span>Subtotal (Taxable Value):</span>
              <span className="font-bold text-white">
                ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-neutral-400 text-[11px]">
              <span>Estimated GST (18% B2B Input Tax):</span>
              <span>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-neutral-700 pt-2 flex justify-between text-sm font-black text-white">
              <span>Proforma Grand Total:</span>
              <span className="text-[#DC2626] font-mono">
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Guarantee Note */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Orders automatically generate a signed B2B Proforma Invoice and sync to the central admin queue.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>

          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={isSubmitting || cart.items.length === 0}
            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Proforma...</span>
              </>
            ) : (
              <>
                <span>Place Order & Generate Proforma</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
