'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopContextBar } from '@/components/navigation/TopContextBar';
import { DesktopSubNav } from '@/components/navigation/DesktopSubNav';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useAppStore, store } from '@/data/store';
import { OrderService } from '@/services/OrderService';
import {
  Building2,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  MapPin,
  Phone,
  Send,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { DealerSearchCombobox } from '@/components/dealers/DealerSearchCombobox';
import confetti from 'canvas-confetti';

export default function NewOrderPage() {
  const router = useRouter();
  const { dealers, cart, rewardConfig, currentUser, settings } = useAppStore();

  const isAdmin = currentUser?.role === 'ADMIN';

  const [notes, setNotes] = useState(cart.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Do NOT preselect a vendor: null if none explicitly selected
  const selectedDealer = cart.dealerId
    ? dealers.find((d) => d.id === cart.dealerId) || null
    : null;

  const totals = OrderService.calculateOrderTotals(cart.items, rewardConfig);

  const handleDealerChange = (dealerId: string) => {
    store.setCartDealer(dealerId);
  };

  const handleSubmitOrder = () => {
    if (!selectedDealer || cart.items.length === 0) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const order = store.submitCurrentOrder();
      setIsSubmitting(false);
      setSubmittedOrder(order);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    }, 450);
  };

  // Generate WhatsApp message with products and quantities only (NO PRICES)
  const getWhatsAppMessageText = () => {
    if (!submittedOrder) return '';
    const itemsList = (submittedOrder.items || [])
      .map(
        (item: any, idx: number) =>
          `${idx + 1}. *${item.productName}* (${item.productCode})\n   • Spec: ${item.variantDescription}\n   • Qty: *${item.quantity} ${item.packingUnit || 'Pcs'}*`
      )
      .join('\n\n');

    return (
      `*FILTEC ONE — NEW FIELD ORDER REQUISITION*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Order No:* ${submittedOrder.orderNumber}\n` +
      `🏢 *Dealer:* ${submittedOrder.dealerName}\n` +
      `📍 *Location:* ${submittedOrder.dealerCity}\n` +
      `📞 *Dealer Phone:* ${submittedOrder.dealerPhone}\n` +
      `👤 *Field Staff:* ${currentUser.name} (${currentUser.phone})\n` +
      `📅 *Date:* ${new Date().toLocaleDateString('en-IN')}\n\n` +
      `📦 *ORDERED PRODUCTS & QUANTITIES:*\n` +
      `${itemsList}\n\n` +
      (submittedOrder.notes ? `📝 *Delivery Notes:* ${submittedOrder.notes}\n\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*FILTEC Polyplast Pvt. Ltd.* — Official Requisition`
    );
  };

  const handleCopyWhatsApp = () => {
    const text = getWhatsAppMessageText();
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };

  // Build WhatsApp URLs
  const rawAdminPhone = settings?.company?.supportWhatsApp || '+91 9437505814';
  const adminPhoneDigits = rawAdminPhone.replace(/\D/g, '') || '919437505814';
  const cleanAdminPhone = adminPhoneDigits.length === 10 ? `91${adminPhoneDigits}` : adminPhoneDigits;
  // Display phone: always show as "+91 XXXXXXXXXX"
  const adminPhoneDisplay = (() => {
    const digits = adminPhoneDigits.replace(/^91(?=\d{10})/, '');
    return `+91 ${digits}`;
  })();
  const adminWhatsAppUrl = submittedOrder
    ? `https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(getWhatsAppMessageText())}`
    : '#';

  const cleanDealerPhone = submittedOrder?.dealerPhone?.replace(/\D/g, '') || '';
  const dealerPhoneWithCountry = cleanDealerPhone.length === 10 ? `91${cleanDealerPhone}` : cleanDealerPhone;
  const dealerWhatsAppUrl = submittedOrder && cleanDealerPhone
    ? `https://wa.me/${dealerPhoneWithCountry}?text=${encodeURIComponent(getWhatsAppMessageText())}`
    : '#';

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-mobile-nav">
      <TopContextBar title="Create Field Order" subtitle="Employee Flow" />
      <DesktopSubNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/employee/catalogue"
            className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#111827] font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Catalogue</span>
          </Link>
          <span className="text-[11px] font-mono text-[#6B7280]">
            Lifecycle: DRAFT → SUBMITTED → DISPATCHED
          </span>
        </div>

        {/* STEP 1: DEALER SELECTION */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-[#DC2626] tracking-wider">
                Step 1 of 2
              </span>
              <h3 className="text-sm font-bold text-[#111827] mt-0.5">
                Select Dealer Account
              </h3>
            </div>
            <span className="text-xs font-mono text-[#6B7280]">
              {selectedDealer ? 'Dealer Verified' : 'Action Required'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#111827] block mb-1.5">
                Select Dealer Account:
              </label>
              <DealerSearchCombobox
                dealers={dealers}
                selectedDealerId={selectedDealer?.id || null}
                onSelectDealer={(dealer) => handleDealerChange(dealer.id)}
                placeholder="Click or type to search authorized dealer (e.g. Ashirbad, Mamata, Kendrapara)..."
              />
            </div>

            {/* Selected Dealer Snapshot or Guidance Note */}
            {selectedDealer ? (
              <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs animate-in fade-in-50 duration-150">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">City / District</span>
                  <span className="font-medium text-[#111827] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#DC2626]" />
                    {selectedDealer.city}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">Contact Phone</span>
                  <span className="font-mono text-[#111827] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-neutral-400" />
                    {selectedDealer.phone}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">Dealer Code</span>
                  <span className="font-mono font-semibold text-neutral-800">{selectedDealer.code}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">Market / Area</span>
                  <span className="font-medium text-neutral-800 truncate block">{selectedDealer.address}</span>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Please search and select an authorized dealer partner above to book this order.</span>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: ORDER ITEMS & CART */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-[#DC2626] tracking-wider">
                Step 2 of 2
              </span>
              <h3 className="text-sm font-bold text-[#111827] mt-0.5">
                Order Items ({cart.items.length})
              </h3>
            </div>
            <Link
              href="/employee/catalogue"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add More Products</span>
            </Link>
          </div>

          {cart.items.length > 0 ? (
            <div className="space-y-3">
              <div className="divide-y divide-[#F3F4F6]">
                {cart.items.map((item) => (
                  <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="tech-code font-bold bg-[#111827] text-white text-xs px-2 py-0.5 rounded shrink-0">
                        {item.productCode}
                      </span>
                      <div>
                        <h4 className="font-semibold text-xs text-[#111827] leading-snug">
                          {item.productName}
                        </h4>
                        <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                          {item.variantDescription} • Pack: {item.packingQty} {item.packingUnit}
                          {isAdmin && ` • Rate: ₹${item.unitPrice.toFixed(2)}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#E5E7EB] rounded bg-[#F9FAFB] text-xs">
                        <button
                          type="button"
                          onClick={() => store.updateCartItemQty(item.id, item.quantity - item.packingQty)}
                          className="px-2.5 py-1 text-neutral-600 hover:text-black"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 font-mono font-semibold text-[#111827]">
                          {item.quantity} {item.packingUnit}
                        </span>
                        <button
                          type="button"
                          onClick={() => store.updateCartItemQty(item.id, item.quantity + item.packingQty)}
                          className="px-2.5 py-1 text-neutral-600 hover:text-black"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line total only visible to Admin */}
                      {isAdmin && (
                        <div className="text-right min-w-[90px]">
                          <span className="font-mono font-bold text-xs text-[#111827] block">
                            ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => store.removeFromCart(item.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1 rounded"
                        title="Remove product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Notes */}
              <div className="pt-3 border-t border-[#F3F4F6]">
                <label className="text-xs font-semibold text-[#111827] block mb-1">
                  Field Delivery Notes (Optional):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Urgent delivery needed, deliver to Kendrapara depot..."
                  className="w-full text-xs p-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              {/* Order Summary: Admin gets full pricing; Staff/Dealers get quantity composition */}
              {isAdmin ? (
                <div className="mt-4 pt-3 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Commercial Incentive Preview */}
                  <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] text-xs space-y-1.5">
                    <div className="text-[10px] uppercase font-mono font-bold text-[#4B5563]">
                      Estimated Rewards ({rewardConfig.ratePercent}% Sales Rule)
                    </div>
                    <div className="flex justify-between text-[#4B5563]">
                      <span>Total Incentive:</span>
                      <span className="font-mono font-bold text-[#111827]">₹{totals.totalReward.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#6B7280] text-[11px]">
                      <span>Dealer Credit ({rewardConfig.dealerSharePercent}%):</span>
                      <span className="font-mono font-semibold text-emerald-700">₹{totals.dealerReward.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#6B7280] text-[11px]">
                      <span>Plumber Pool ({rewardConfig.plumberSharePercent}%):</span>
                      <span className="font-mono font-semibold text-blue-700">₹{totals.plumberReward.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Subtotal & Total Value */}
                  <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] text-xs space-y-1.5">
                    <div className="flex justify-between text-[#4B5563]">
                      <span>Subtotal:</span>
                      <span className="font-mono font-medium text-[#111827]">
                        ₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#6B7280]">
                      <span>GST (18%):</span>
                      <span className="font-mono text-[#111827]">
                        ₹{totals.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="border-t border-[#E5E7EB] pt-1.5 flex justify-between text-sm font-bold text-[#111827]">
                      <span>Total Order Value:</span>
                      <span className="font-mono text-[#DC2626]">
                        ₹{totals.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-[#E5E7EB] bg-[#F8F9FA] p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#6B7280] block font-bold">
                      Requisition Order Summary
                    </span>
                    <span className="font-bold text-sm text-[#111827]">
                      {cart.items.length} Product Line{cart.items.length > 1 ? 's' : ''} • {cart.items.reduce((s, i) => s + i.quantity, 0)} Total Units
                    </span>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      Order will be dispatched via WhatsApp to dealer and administrative center upon submission.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0 font-medium">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Dispatch Ready</span>
                  </div>
                </div>
              )}

              {/* Submit Order Action Button */}
              <div className="mt-4 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-[#6B7280]">
                  {!selectedDealer ? (
                    <span className="text-amber-700 font-medium">⚠️ Please select a dealer account in Step 1 to proceed.</span>
                  ) : (
                    <span>Submitting will book this order and prepare instant WhatsApp dispatch.</span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!selectedDealer || cart.items.length === 0 || isSubmitting}
                  onClick={handleSubmitOrder}
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Submitting Order...'
                      : !selectedDealer
                      ? 'Select Dealer to Submit'
                      : 'Submit & Send to WhatsApp'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#F9FAFB] rounded-lg border border-dashed border-[#E5E7EB]">
              <BookOpen className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <h4 className="font-semibold text-sm text-[#111827]">Your field order is empty</h4>
              <p className="text-xs text-[#6B7280] mt-1">
                Browse the catalogue to select products and quantities.
              </p>
              <Link
                href="/employee/catalogue"
                className="mt-3 inline-flex items-center gap-1.5 bg-[#111827] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-black transition-all"
              >
                <span>Open Product Catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />

      {/* Submission Success Modal with Direct WhatsApp Buttons */}
      {submittedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 text-left">
            <div className="flex items-center gap-3 pb-4 border-b border-[#F3F4F6]">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#111827]">
                  Order Requisition Booked!
                </h3>
                <span className="text-xs font-mono font-bold text-[#DC2626]">
                  {submittedOrder.orderNumber}
                </span>
              </div>
            </div>

            {/* Order Details (NO PRICES) */}
            <div className="my-4 bg-neutral-50 rounded-xl p-3.5 border border-[#E5E7EB] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Dealer Partner:</span>
                <span className="font-bold text-[#111827]">{submittedOrder.dealerName} ({submittedOrder.dealerCity})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Dealer Contact:</span>
                <span className="font-mono text-[#111827]">{submittedOrder.dealerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Line Items:</span>
                <span className="font-semibold text-[#111827]">
                  {submittedOrder.items?.length || 0} Products ({submittedOrder.items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 0} Total Units)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Field Representative:</span>
                <span className="font-medium text-[#111827]">{currentUser.name}</span>
              </div>
            </div>

            {/* WhatsApp Dispatch Action Center */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-mono uppercase font-bold text-[#4B5563]">
                Instant WhatsApp Dispatch:
              </div>

              {/* 1. Send to Dealer WhatsApp */}
              <a
                href={dealerWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Send to Dealer ({submittedOrder.dealerPhone})</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>




              {/* 3. One-click Copy message */}
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
                    <span>Copy Full Order WhatsApp Message</span>
                  </>
                )}
              </button>
            </div>

            {/* Bottom Navigation */}
            <div className="mt-5 pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSubmittedOrder(null);
                  router.push('/employee/catalogue');
                }}
                className="text-xs text-[#6B7280] hover:text-[#111827] font-medium"
              >
                + Book Another Order
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmittedOrder(null);
                  router.push('/employee/orders');
                }}
                className="text-xs font-semibold text-[#DC2626] hover:underline"
              >
                View in Order History →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
