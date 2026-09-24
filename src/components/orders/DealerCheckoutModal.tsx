'use client';

import React, { useState } from 'react';
import { useAppStore, store } from '@/data/store';
import { Order, OrderItem } from '@/types';
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
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  MessageSquare,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DealerCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DealerCheckoutModal({ isOpen, onClose }: DealerCheckoutModalProps) {
  const { cart, dealers, currentUser, settings } = useAppStore();
  const [notes, setNotes] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  if (!isOpen) return null;

  const currentDealer = dealers.find((d) => d.id === currentUser.dealerId) || dealers[0];
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
      if (notes.trim() || poNumber.trim()) {
        store.setCartNotes(`${poNumber ? `PO Ref: ${poNumber.trim()} • ` : ''}${notes.trim()}`);
      }
      const order = store.submitCurrentOrder();
      if (!order) {
        setIsSubmitting(false);
        return;
      }

      // Notify admin async
      try {
        fetch('/api/orders/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            orderNumber: order.orderNumber,
            dealerName: order.dealerName,
            dealerCity: order.dealerCity,
            dealerPhone: order.dealerPhone,
            itemsCount: order.items.length,
            items: order.items,
            timestamp: new Date().toISOString()
          })
        }).catch((e) => console.warn('Admin notification async trigger:', e));
      } catch (err) {}

      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      setSubmittedOrder(order);
    } catch (err) {
      console.error('Failed to submit dealer order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp message generation (Products + Quantities ONLY, ZERO price mention)
  const getWhatsAppMessageText = () => {
    if (!submittedOrder) return '';
    const itemsList = (submittedOrder.items || [])
      .map(
        (item: any, idx: number) =>
          `${idx + 1}. *${item.productName}* (${item.productCode})\n   • Spec: ${item.variantDescription}\n   • Quantity: *${item.quantity} ${item.packingUnit || 'Pcs'}*`
      )
      .join('\n\n');

    return (
      `*FILTEC ONE — DEALER ORDER REQUISITION*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Order No:* ${submittedOrder.orderNumber}\n` +
      `🏢 *Dealer:* ${submittedOrder.dealerName}\n` +
      `📍 *Location:* ${submittedOrder.dealerCity}\n` +
      `📞 *Phone:* ${submittedOrder.dealerPhone}\n` +
      `📅 *Date:* ${new Date().toLocaleDateString('en-IN')}\n\n` +
      `📦 *ORDERED PRODUCTS & QUANTITIES:*\n` +
      `${itemsList}\n\n` +
      (submittedOrder.notes ? `📝 *Dispatch Notes:* ${submittedOrder.notes}\n\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*FILTEC Polyplast Pvt. Ltd.* — Order Requisition`
    );
  };

  const handleCopyWhatsApp = () => {
    const text = getWhatsAppMessageText();
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };

  const rawAdminPhone = settings?.company?.supportWhatsApp || '+91 9437505814';
  const adminPhoneDigits = rawAdminPhone.replace(/\D/g, '') || '919437505814';
  const cleanAdminPhone = adminPhoneDigits.length === 10 ? `91${adminPhoneDigits}` : adminPhoneDigits;
  const adminPhoneDisplay = '+91 ' + adminPhoneDigits.replace(/^91(?=\d{10})/, '');
  const adminWhatsAppUrl = submittedOrder
    ? `https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(getWhatsAppMessageText())}`
    : '#';

  const cleanDealerPhone = submittedOrder?.dealerPhone?.replace(/\D/g, '') || '';
  const dealerPhoneWithCountry = cleanDealerPhone.length === 10 ? `91${cleanDealerPhone}` : cleanDealerPhone;
  const dealerWhatsAppUrl = submittedOrder && cleanDealerPhone
    ? `https://wa.me/${dealerPhoneWithCountry}?text=${encodeURIComponent(getWhatsAppMessageText())}`
    : '#';

  // If order was successfully submitted, display Confirmation & WhatsApp Dispatch Modal
  if (submittedOrder) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 text-left my-auto animate-in fade-in duration-200">
          <div className="flex items-center gap-3 pb-4 border-b border-[#F3F4F6]">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#111827]">
                Order Requisition Submitted!
              </h3>
              <span className="text-xs font-mono font-bold text-[#DC2626]">
                {submittedOrder.orderNumber}
              </span>
            </div>
          </div>

          <div className="my-4 bg-neutral-50 rounded-xl p-3.5 border border-[#E5E7EB] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Dealer Partner:</span>
              <span className="font-bold text-[#111827]">{submittedOrder.dealerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Contact Number:</span>
              <span className="font-mono text-[#111827]">{submittedOrder.dealerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Total Items:</span>
              <span className="font-semibold text-[#111827]">
                {submittedOrder.items?.length || 0} Products ({submittedOrder.items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 0} Units)
              </span>
            </div>
          </div>

          {/* WhatsApp Dispatch Buttons */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono uppercase font-bold text-[#4B5563]">
              Send Order Requisition via WhatsApp:
            </div>

            <a
              href={dealerWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Send to My WhatsApp ({submittedOrder.dealerPhone})</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>




            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="w-full border border-neutral-300 hover:bg-neutral-100 text-[#111827] text-xs font-medium py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              {copiedWhatsApp ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">WhatsApp Message Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Copy WhatsApp Order List</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-5 pt-3 border-t border-[#F3F4F6] flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setSubmittedOrder(null);
                onClose();
              }}
              className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-lg transition-all"
            >
              Done & Close
            </button>
          </div>
        </div>
      </div>
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
                Review Order Requisition
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Products & quantities for {currentDealer?.name}
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

          {/* Cart Items List - Products & Quantities ONLY (NO PRICES) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono uppercase font-bold text-[10px] text-[#6B7280]">
                Selected Products ({cart.items.length})
              </span>
              <span className="font-mono text-[10px] text-neutral-500 font-bold">
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
                        Spec: {item.variantDescription} • Pack: {item.packingQty} {item.packingUnit}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item, -1)}
                          className="px-2.5 py-1 hover:bg-neutral-100 text-neutral-600 font-bold"
                          title="Decrease Lot"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 font-mono font-bold text-neutral-900 text-xs">
                          {item.quantity} {item.packingUnit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item, 1)}
                          className="px-2.5 py-1 hover:bg-neutral-100 text-neutral-600 font-bold"
                          title="Increase Lot"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1.5 rounded transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
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

          {/* Requisition Order Summary (NO FINANCIALS / ZERO PRICES) */}
          <div className="p-4 bg-neutral-900 text-white rounded-xl space-y-2 text-xs shadow-md">
            <div className="flex justify-between items-center text-neutral-300">
              <span className="font-mono uppercase text-[10px] text-neutral-400">Products Selected:</span>
              <span className="font-bold text-white font-mono">{cart.items.length} Product Lines</span>
            </div>
            <div className="flex justify-between items-center text-neutral-300">
              <span className="font-mono uppercase text-[10px] text-neutral-400">Total Units Booked:</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">{totalUnits} Units</span>
            </div>
            <div className="border-t border-neutral-700 pt-2 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Order Dispatch:</span>
              <span className="text-emerald-400 font-medium">Direct WhatsApp to Dealer & Admin</span>
            </div>
          </div>

          {/* Note */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Upon submission, order item list and quantities will be formatted for instant WhatsApp dispatch.
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
                <span>Submitting Requisition...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Order & Send to WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
