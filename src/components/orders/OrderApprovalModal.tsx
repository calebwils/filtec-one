'use client';

import React, { useState } from 'react';
import { Order } from '@/types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { ProformaInvoiceModal } from './ProformaInvoiceModal';
import { store } from '@/data/store';
import { CheckCircle2, XCircle, Clock, Building2, User, Phone, MapPin, X, ArrowRight, ShieldCheck, Receipt } from 'lucide-react';
import confetti from 'canvas-confetti';

export function OrderApprovalModal({
  order,
  isOpen,
  onClose
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProforma, setShowProforma] = useState(false);

  if (!isOpen || !order) return null;

  const handleApprove = () => {
    setIsProcessing(true);
    setTimeout(() => {
      store.approveOrder(order.id, adminNotes);
      setIsProcessing(false);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {
        // ignore
      }
      onClose();
    }, 400);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      store.rejectOrder(order.id, rejectionReason);
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-8">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#111827] font-mono">
                  {order.orderNumber}
                </h3>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Submitted on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-md hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Dealer & Employee Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F9FAFB] p-3.5 rounded-lg border border-[#E5E7EB]">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block font-semibold mb-1">
                Dealer / Customer
              </span>
              <div className="font-semibold text-sm text-[#111827] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-neutral-500 shrink-0" />
                {order.dealerName}
              </div>
              <div className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                {order.dealerCity}
              </div>
              <div className="text-xs text-[#6B7280] mt-0.5 flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                {order.dealerPhone}
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-[#E5E7EB] sm:pl-3.5 pt-2 sm:pt-0">
              <span className="text-[10px] uppercase font-mono text-[#9CA3AF] block font-semibold mb-1">
                Sales Representative
              </span>
              <div className="font-semibold text-sm text-[#111827] flex items-center gap-1.5">
                <User className="w-4 h-4 text-neutral-500 shrink-0" />
                {order.employeeName}
              </div>
              <div className="text-xs text-[#6B7280] mt-1 font-mono">
                ID: {order.employeeId}
              </div>
              {order.notes && (
                <div className="mt-2 text-xs text-amber-900 bg-amber-50 p-2 rounded border border-amber-200">
                  <span className="font-semibold">Note:</span> {order.notes}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs uppercase font-mono font-semibold text-[#6B7280]">
                Ordered Items ({order.items.length})
              </h4>
              <span className="text-xs font-mono text-[#6B7280]">Price Authority: Billing ERP</span>
            </div>

            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#4B5563] font-mono uppercase text-[10px] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="py-2 px-3">Code / Product</th>
                    <th className="py-2 px-3">Spec</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Rate</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/60">
                      <td className="py-2.5 px-3">
                        <span className="tech-code font-bold bg-[#111827] text-white text-[10px] px-1.5 py-0.5 rounded mr-1.5">
                          {item.productCode}
                        </span>
                        <span className="font-medium text-[#111827]">{item.productName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[#6B7280] font-mono">{item.variantDescription}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#111827]">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#4B5563]">
                        ₹{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#111827]">
                        ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary & Estimated Rewards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] text-xs space-y-1.5">
              <div className="text-[11px] font-mono uppercase font-semibold text-[#4B5563]">
                Commercial Incentive (1% Rule)
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Total Generated Reward:</span>
                <span className="font-mono font-bold text-[#111827]">₹{order.rewardEstimated.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#6B7280] text-[11px]">
                <span>Dealer Share (75%):</span>
                <span className="font-mono font-semibold text-emerald-700">₹{order.rewardDealerShare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#6B7280] text-[11px]">
                <span>Plumber Pool (25%):</span>
                <span className="font-mono font-semibold text-blue-700">₹{order.rewardPlumberShare.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] text-xs space-y-1.5">
              <div className="flex justify-between text-[#4B5563]">
                <span>Subtotal:</span>
                <span className="font-mono font-medium text-[#111827]">
                  ₹{order.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>GST (18%):</span>
                <span className="font-mono text-[#111827]">
                  ₹{order.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-[#E5E7EB] pt-1.5 flex justify-between text-sm font-bold text-[#111827]">
                <span>Total Order Value:</span>
                <span className="font-mono text-[#DC2626]">
                  ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Rejection input when isRejecting */}
          {isRejecting && (
            <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
              <label className="text-xs font-semibold text-rose-900 block mb-1">
                Reason for Rejection (sent to field officer and dealer):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                placeholder="e.g. Insufficient dealer credit limit, MOQ not met, or size unavailable..."
                className="w-full text-xs p-2 rounded border border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#E5E7EB] bg-[#F8F9FA] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowProforma(true)}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-neutral-50 text-[#111827] border border-[#D1D5DB] flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Receipt className="w-4 h-4 text-[#DC2626]" />
              <span>View Proforma</span>
            </button>
            <span className="hidden sm:inline text-[11px] text-[#6B7280]">
              Official B2B Commercial Proforma
            </span>
          </div>

          {order.status === 'PENDING_ADMIN_APPROVAL' ? (
            <div className="flex items-center gap-2">
              {!isRejecting ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
                  >
                    Reject Order
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleApprove}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Dispatch to ERP</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!rejectionReason.trim() || isProcessing}
                    onClick={handleReject}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Confirm Rejection</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="text-xs font-mono font-medium text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Processed {order.invoiceNumber ? `(${order.invoiceNumber})` : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Commercial Proforma Invoice Modal */}
      <ProformaInvoiceModal
        order={order}
        isOpen={showProforma}
        onClose={() => setShowProforma(false)}
      />
    </div>
  );
}
