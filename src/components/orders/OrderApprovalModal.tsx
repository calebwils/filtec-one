'use client';

import React, { useState } from 'react';
import { Order } from '@/types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { store } from '@/data/store';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  Phone,
  MapPin,
  X,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function OrderApprovalModal({
  order,
  isOpen,
  onClose,
  onOpenRelease
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRelease?: (order: Order) => void;
}) {
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  if (!isOpen || !order) return null;

  const getWhatsAppMessageText = () => {
    if (!order) return '';
    const itemsList = (order.items || [])
      .map(
        (item, idx) =>
          `${idx + 1}. *${item.productName}* (${item.productCode})\n   • Spec: ${item.variantDescription}\n   • Quantity: *${item.quantity} ${item.packingUnit || 'Pcs'}*`
      )
      .join('\n\n');

    return (
      `*FILTEC ONE — ORDER REQUISITION*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Order No:* ${order.orderNumber}\n` +
      `🏢 *Dealer:* ${order.dealerName}\n` +
      `📍 *Location:* ${order.dealerCity}\n` +
      `📞 *Phone:* ${order.dealerPhone}\n` +
      `👤 *Field Staff:* ${order.employeeName}\n` +
      `📅 *Date:* ${new Date(order.createdAt).toLocaleDateString('en-IN')}\n\n` +
      `📦 *ORDERED PRODUCTS & QUANTITIES:*\n` +
      `${itemsList}\n\n` +
      (order.notes ? `📝 *Dispatch Notes:* ${order.notes}\n\n` : '') +
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:hidden">
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
                Commercial Incentive (1% of Total Order Value)
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Total Reward (1%):</span>
                <span className="font-mono font-bold text-[#111827]">₹{order.rewardEstimated.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#6B7280] text-[11px]">
                <span>Dealer Share (75%):</span>
                <span className="font-mono font-semibold text-emerald-700">₹{order.rewardDealerShare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#6B7280] text-[11px]">
                <span>Plumber Share (25%):</span>
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
                placeholder="e.g. MOQ not met, size unavailable, or commercial hold..."
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
              onClick={handleCopyWhatsApp}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-neutral-50 text-[#111827] border border-[#D1D5DB] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {copiedWhatsApp ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied WhatsApp!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-neutral-500" />
                  <span>Copy WhatsApp Order</span>
                </>
              )}
            </button>
            <a
              href={`https://wa.me/${order.dealerPhone?.replace(/\D/g, '').length === 10 ? `91${order.dealerPhone?.replace(/\D/g, '')}` : order.dealerPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(getWhatsAppMessageText())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-neutral-50 text-[#111827] border border-[#D1D5DB] flex items-center gap-1.5 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-neutral-600" />
              <span>Dealer WhatsApp</span>
            </a>
          </div>

          {order.status === 'PENDING_ADMIN_APPROVAL' || order.status === 'SUBMITTED' ? (
            <button
              type="button"
              onClick={() => {
                if (onOpenRelease) {
                  onOpenRelease(order);
                } else {
                  store.releaseOrder(order.id);
                  onClose();
                }
              }}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#111827] hover:bg-black text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-neutral-300" />
              <span>Release Order</span>
            </button>
          ) : (
            <div className="text-xs font-mono font-medium text-neutral-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-neutral-500" />
              <span>Completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
