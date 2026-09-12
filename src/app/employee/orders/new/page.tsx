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
  ShieldAlert,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function NewOrderPage() {
  const router = useRouter();
  const { dealers, cart, rewardConfig, currentUser } = useAppStore();

  const [notes, setNotes] = useState(cart.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);

  const selectedDealer = dealers.find((d) => d.id === cart.dealerId) || dealers[0];

  const totals = OrderService.calculateOrderTotals(cart.items, rewardConfig);

  const handleDealerChange = (dealerId: string) => {
    store.setCartDealer(dealerId);
  };

  const handleSubmitOrder = () => {
    if (cart.items.length === 0) return;
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
            Lifecycle: DRAFT → SUBMITTED → PENDING_ADMIN_APPROVAL
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
              Credit Limit Verified
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#111827] block mb-1.5">
                Select Dealer:
              </label>
              <select
                value={cart.dealerId || selectedDealer?.id}
                onChange={(e) => handleDealerChange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] focus:outline-none focus:ring-1 focus:ring-[#DC2626] font-medium"
              >
                {dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name} — {dealer.city} ({dealer.tier} Tier)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Dealer Snapshot */}
            {selectedDealer && (
              <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">City</span>
                  <span className="font-medium text-[#111827]">{selectedDealer.city}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">Contact</span>
                  <span className="font-mono text-[#111827]">{selectedDealer.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">Outstanding Balance</span>
                  <span className="font-mono font-semibold text-amber-800">
                    ₹{selectedDealer.outstandingBalance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block">Credit Limit</span>
                  <span className="font-mono font-semibold text-neutral-800">
                    ₹{selectedDealer.creditLimit.toLocaleString('en-IN')}
                  </span>
                </div>
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
                          {item.variantDescription} • Rate: ₹{item.unitPrice.toFixed(2)}
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

                      {/* Line total */}
                      <div className="text-right min-w-[90px]">
                        <span className="font-mono font-bold text-xs text-[#111827] block">
                          ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => store.removeFromCart(item.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1 rounded"
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
                  placeholder="e.g. Deliver before 2 PM to Mithakhali branch warehouse..."
                  className="w-full text-xs p-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>

              {/* Financial Calculation Summary */}
              <div className="mt-4 pt-3 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Commercial Incentive Preview (1% Rule) */}
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

              {/* Submit Order Action Button */}
              <div className="mt-4 pt-3 flex items-center justify-between">
                <div className="text-xs text-[#6B7280]">
                  Submitting will automatically notify Admin for central authorization.
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitOrder}
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting Order...' : 'Submit to Admin Approval'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#F9FAFB] rounded-lg border border-dashed border-[#E5E7EB]">
              <BookOpen className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <h4 className="font-semibold text-sm text-[#111827]">Your field order is empty</h4>
              <p className="text-xs text-[#6B7280] mt-1">
                Browse the digital catalogue to select uPVC / CPVC pipes, fittings, or valves.
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

      {/* Submission Success Modal */}
      {submittedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 text-center shadow-2xl border border-neutral-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-[#111827]">
              Order Successfully Submitted!
            </h3>
            <p className="text-xs font-mono font-semibold text-[#DC2626] mt-0.5">
              {submittedOrder.orderNumber}
            </p>
            <p className="text-xs text-[#4B5563] mt-2">
              Order of <strong>₹{submittedOrder.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> for{' '}
              <strong>{submittedOrder.dealerName}</strong> is now in status{' '}
              <span className="font-mono bg-amber-50 text-amber-800 border border-amber-200 px-1 rounded">
                PENDING_ADMIN_APPROVAL
              </span>
              .
            </p>

            <div className="mt-4 p-3 bg-neutral-50 rounded text-xs text-left border border-[#E5E7EB] space-y-1">
              <div className="text-[10px] font-mono uppercase font-bold text-[#6B7280]">
                Automated System Triggers:
              </div>
              <div className="text-emerald-700 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3" />
                <span>Simulated WhatsApp notification dispatched to dealer</span>
              </div>
              <div className="text-emerald-700 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3" />
                <span>Audit entry logged under field rep {currentUser.name}</span>
              </div>
            </div>

            {/* Complete Vertical Slice Shortcut */}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => {
                  store.switchUser('ADMIN');
                  router.push('/admin/orders');
                }}
                className="w-full bg-[#111827] hover:bg-black text-white text-xs font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Switch to Admin & Review Approval</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmittedOrder(null);
                  router.push('/employee/orders');
                }}
                className="w-full border border-neutral-300 hover:bg-neutral-50 text-[#111827] text-xs font-medium py-2 rounded-lg"
              >
                View in Employee Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
