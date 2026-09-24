'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { RewardVoucher } from '@/types';
import {
  generateVirtualCardBlob,
  encodeVoucherToUrlParam
} from '@/utils/virtualCardGenerator';
import { useAppStore } from '@/data/store';
import {
  Award,
  Calendar,
  CheckCircle2,
  Copy,
  Download,
  Phone,
  Printer,
  Share2,
  ShieldCheck,
  Tag,
  CreditCard,
  Sparkles,
  Loader2,
  X,
  ExternalLink,
  MessageSquare,
  Check
} from 'lucide-react';

interface RewardVoucherCardProps {
  voucher: RewardVoucher;
  onClose?: () => void;
  showActions?: boolean;
}

export function RewardVoucherCard({
  voucher,
  onClose,
  showActions = true
}: RewardVoucherCardProps) {
  const [copied, setCopied] = useState(false);
  const [isProcessingShare, setIsProcessingShare] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const isDealer = voucher.type === 'DEALER';

  const handleCopy = () => {
    navigator.clipboard.writeText(voucher.voucherNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCard = async () => {
    setIsProcessingShare(true);
    try {
      const blob = await generateVirtualCardBlob(voucher);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FILTEC-Virtual-Card-${voucher.voucherNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download virtual card:', e);
    } finally {
      setIsProcessingShare(false);
    }
  };

  const { dealers } = useAppStore();
  const matchedDealer = dealers.find((d) => d.id === voucher.dealerId || d.name === voucher.dealerName);
  const defaultTargetPhone = voucher.type === 'PLUMBER'
    ? (voucher.plumberPhone || '+91 94378 60479')
    : (matchedDealer?.phone || '+91 94378 60479');

  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState(defaultTargetPhone);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string | null>(null);
  const [cardCopied, setCardCopied] = useState(false);

  const getWhatsAppCardMessage = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const cardUrl = `${origin}/voucher/${voucher.voucherNumber}?d=${encodeVoucherToUrlParam(voucher)}`;
    const beneficiary = isDealer
      ? `${voucher.dealerName} (${voucher.dealerCode || 'Authorized'})`
      : `${voucher.plumberName || 'Valued Plumber'}`;

    const formattedAmount = `₹ ${voucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    return (
`\`\`\`
╔═══════════════════════════════════════════╗
║     ★ FILTEC REWARD VIRTUAL CARD ★        ║
╠═══════════════════════════════════════════╣
║                                           ║
║  CARD CODE:   ${voucher.voucherNumber.padEnd(28)}║
║  VALUE:       ${formattedAmount.padEnd(28)}║
║  POINTS:      ${(voucher.points + ' Incentive Points').padEnd(28)}║
║  BENEFICIARY: ${beneficiary.substring(0, 28).padEnd(28)}║
║  ISSUE DATE:  ${voucher.dateRedeemed.padEnd(28)}║
║  STATUS:      ISSUED (Pending Credit)     ║
║                                           ║
╠═══════════════════════════════════════════╣
║  Finance Contact: +91 94378 60479         ║
║  Settle against next billing invoice.     ║
╚═══════════════════════════════════════════╝
\`\`\`

📲 *Open & View Full Interactive Card:*
${cardUrl}`
    );
  };

  const handleWhatsAppShare = async () => {
    setIsProcessingShare(true);
    setShareNotice(null);

    try {
      // 1. Generate the Virtual Card PNG image blob
      const blob = await generateVirtualCardBlob(voucher);
      setCardBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setCardPreviewUrl(previewUrl);

      // 2. Copy image directly to clipboard for desktop paste (Cmd+V)
      try {
        if (navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCardCopied(true);
        }
      } catch (clipErr) {
        console.warn('Clipboard write image failed:', clipErr);
      }

      // 3. Check if native Web Share with image file is supported (Mobile WhatsApp)
      const file = new File([blob], `FILTEC-Virtual-Card-${voucher.voucherNumber}.png`, {
        type: 'image/png'
      });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `FILTEC Virtual Reward Card ${voucher.voucherNumber}`,
            text: getWhatsAppCardMessage(),
            files: [file]
          });
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return;
        }
      }

      // 4. Automatically download card image as fallback
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `FILTEC-Virtual-Card-${voucher.voucherNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      // 5. Open Dispatch Modal
      setRecipientPhone(defaultTargetPhone);
      setShowDispatchModal(true);
    } catch (err) {
      console.error('Error generating card for WhatsApp:', err);
    } finally {
      setIsProcessingShare(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto select-none print:m-0 print:max-w-none">
      {/* Coupon Container with decorative scalloped notch styling */}
      <div
        className={`relative rounded-2xl overflow-hidden shadow-xl border-2 transition-all ${
          isDealer
            ? 'bg-gradient-to-br from-[#FFFDF9] via-white to-[#FEF2F2] border-[#DC2626]'
            : 'bg-gradient-to-br from-[#F8FAFF] via-white to-[#EEF2FF] border-[#2563EB]'
        }`}
      >
        {/* Top Brand Banner */}
        <div
          className={`px-5 py-3.5 flex items-center justify-between text-white ${
            isDealer
              ? 'bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#B91C1C]'
              : 'bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#1D4ED8]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-white px-2.5 py-1 rounded-md shadow-xs">
              <Image
                src="/brand/filtec-one-logo.png"
                alt="FILTEC ONE"
                width={95}
                height={24}
                className="h-5 w-auto object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider block font-bold text-white/90">
                {isDealer ? 'OFFICIAL DEALER VOUCHER' : 'OFFICIAL PLUMBER COUPON'}
              </span>
              <span className="text-[11px] font-semibold text-white/95">
                FILTEC Polyplast Pvt Ltd
              </span>
            </div>
          </div>

          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
              isDealer
                ? 'bg-amber-400 text-neutral-900 border-amber-300'
                : 'bg-sky-300 text-neutral-900 border-sky-200'
            }`}
          >
            {isDealer ? 'DEALER 75%' : 'PLUMBER 25%'}
          </span>
        </div>

        {/* Coupon Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Voucher Header Row */}
          <div className="flex items-center justify-between gap-3 border-b border-dashed border-neutral-300 pb-4">
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-500 font-bold block tracking-wider">
                VOUCHER NUMBER
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-2xl sm:text-3xl font-mono font-extrabold tracking-tight ${
                    isDealer ? 'text-[#DC2626]' : 'text-[#2563EB]'
                  }`}
                >
                  {voucher.voucherNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy Voucher Code"
                  className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Redeem Points / Cash Value */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-neutral-500 font-bold block tracking-wider">
                REDEEM VALUE
              </span>
              <div
                className={`text-2xl sm:text-3xl font-mono font-black ${
                  isDealer ? 'text-emerald-700' : 'text-blue-700'
                }`}
              >
                ₹{voucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] font-mono text-neutral-500">
                ({voucher.points.toLocaleString('en-IN')} Points)
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block font-semibold">
                DATE OF REDEEM
              </span>
              <div className="font-mono font-bold text-neutral-800 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>{voucher.dateRedeemed}</span>
              </div>
            </div>

            <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block font-semibold">
                STATUS
              </span>
              <div className="font-mono font-bold text-neutral-800 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck
                  className={`w-3.5 h-3.5 ${
                    voucher.status === 'SETTLED' ? 'text-emerald-600' : 'text-amber-500'
                  }`}
                />
                <span
                  className={
                    voucher.status === 'SETTLED' ? 'text-emerald-700' : 'text-amber-700'
                  }
                >
                  {voucher.status === 'SETTLED' ? 'SETTLED (Credit Note)' : 'ISSUED (Pending)'}
                </span>
              </div>
            </div>

            {/* Beneficiary Info */}
            <div className="col-span-2 bg-neutral-50 p-3 rounded-lg border border-neutral-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-500 uppercase font-semibold">
                  {isDealer ? 'DEALER BENEFICIARY' : 'PLUMBER BENEFICIARY'}
                </span>
                {voucher.dealerCode && (
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.2 rounded border border-neutral-300 text-neutral-700">
                    {voucher.dealerCode}
                  </span>
                )}
              </div>
              <div className="font-bold text-sm text-[#111827]">
                {isDealer ? voucher.dealerName : voucher.plumberName}
              </div>
              {!isDealer && voucher.dealerName && (
                <div className="text-[11px] text-neutral-600">
                  Issued via: <span className="font-medium text-neutral-800">{voucher.dealerName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Settlement / Credit Note Notice */}
          <div
            className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              isDealer
                ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                : 'bg-blue-50/70 border-blue-200 text-blue-950'
            }`}
          >
            <Phone className={`w-4 h-4 shrink-0 mt-0.5 ${isDealer ? 'text-[#DC2626]' : 'text-[#2563EB]'}`} />
            <div className="text-[11px]">
              <strong className="font-bold block mb-0.5">
                {isDealer ? 'Credit Note Settlement Instructions:' : 'Plumber Claim Instructions:'}
              </strong>
              {isDealer ? (
                <span>
                  Present this voucher to your <strong>FILTEC Marketing / Sales Executive</strong> or contact Finance at{' '}
                  <strong className="font-mono text-neutral-900">+91 94378 60479</strong> for Credit Note credit against your next invoice.
                </span>
              ) : (
                <span>
                  To redeem your cash reward, present coupon{' '}
                  <strong className="font-mono text-blue-900">{voucher.voucherNumber}</strong> to your dealer or contact FILTEC Head Office at{' '}
                  <strong className="font-mono text-neutral-900">+91 94378 60479</strong>.
                </span>
              )}
            </div>
          </div>

          {/* Simulated Barcode / Security Footer */}
          <div className="pt-2 border-t border-dashed border-neutral-300 flex items-center justify-between text-[9px] font-mono text-neutral-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-neutral-400" />
              <span>AUTHENTIC FILTEC REWARD TOKEN • IMMUTABLE</span>
            </div>
            <span>ID: {voucher.id}</span>
          </div>
        </div>
      </div>

      {/* Share / Copy Notice */}
      {shareNotice && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{shareNotice}</span>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 print:hidden">
          <button
            type="button"
            disabled={isProcessingShare}
            onClick={handleWhatsAppShare}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isProcessingShare ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>Send on WhatsApp</span>
          </button>

          <button
            type="button"
            disabled={isProcessingShare}
            onClick={handleDownloadCard}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all border border-neutral-300 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-neutral-600" />
            <span>Download Card (PNG)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-all cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      )}
      {/* WhatsApp Direct Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 text-[#111827] space-y-4 animate-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#111827]">Direct WhatsApp Dispatch</h4>
                  <p className="text-[11px] text-[#6B7280]">
                    Send Virtual Card to {isDealer ? voucher.dealerName : (voucher.plumberName || 'Beneficiary')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Generated Virtual Card Preview */}
            {cardPreviewUrl && (
              <div className="relative rounded-xl overflow-hidden border border-neutral-200 shadow-xs bg-neutral-900">
                <img
                  src={cardPreviewUrl}
                  alt="Virtual Card Preview"
                  className="w-full h-auto object-contain"
                />
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Virtual Card Ready</span>
                </div>
              </div>
            )}

            {/* Clipboard Status Banner */}
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="font-bold block text-emerald-950">
                  Card Image Copied to Clipboard!
                </strong>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  When WhatsApp opens, simply press <strong>Paste (⌘V on Mac, Ctrl+V on Windows)</strong> to send the full-color card directly into the chat!
                </p>
              </div>
            </div>

            {/* Recipient Phone Input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Recipient WhatsApp Number:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+91 94378 60479 or 9898099881"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Auto-detected for {isDealer ? voucher.dealerName : (voucher.plumberName || 'beneficiary')}. You can change this to any phone number.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const clean = recipientPhone.replace(/\D/g, '');
                  const finalPhone = clean.length === 10 ? `91${clean}` : clean;
                  const text = getWhatsAppCardMessage();
                  const waUrl = finalPhone
                    ? `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`
                    : `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(waUrl, '_blank');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Launch WhatsApp & Paste Card</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (cardBlob) {
                      try {
                        await navigator.clipboard.write([
                          new ClipboardItem({ 'image/png': cardBlob })
                        ]);
                        setCardCopied(true);
                        setTimeout(() => setCardCopied(false), 2000);
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {cardCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{cardCopied ? 'Image Copied!' : 'Re-Copy Card Image'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCard}
                  className="flex-1 py-2 px-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
