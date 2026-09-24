'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { RewardVoucher } from '@/types';
import {
  generateVirtualCardBlob,
  encodeVoucherToUrlParam
} from '@/utils/virtualCardGenerator';
import { useAppStore } from '@/data/store';
import {
  Calendar,
  CheckCircle2,
  Copy,
  Download,
  Phone,
  Printer,
  Share2,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Loader2,
  ExternalLink,
  Check,
  Wifi
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isProcessingShare, setIsProcessingShare] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const isDealer = voucher.type === 'DEALER';

  const { dealers } = useAppStore();
  const matchedDealer = dealers.find(
    (d) => d.id === voucher.dealerId || d.name === voucher.dealerName
  );

  const defaultPhone =
    voucher.type === 'PLUMBER'
      ? voucher.plumberPhone || '+91 94378 60479'
      : matchedDealer?.phone || '+91 94378 60479';

  const [recipientPhone, setRecipientPhone] = useState(defaultPhone);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string | null>(null);

  // Pre-generate high-resolution virtual card PNG blob immediately upon mounting
  useEffect(() => {
    let isMounted = true;
    generateVirtualCardBlob(voucher)
      .then((blob) => {
        if (isMounted) {
          setCardBlob(blob);
          const url = URL.createObjectURL(blob);
          setCardPreviewUrl(url);
        }
      })
      .catch((err) => {
        console.warn('Pre-generating virtual card blob failed:', err);
      });

    return () => {
      isMounted = false;
      if (cardPreviewUrl) {
        URL.revokeObjectURL(cardPreviewUrl);
      }
    };
  }, [voucher]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(voucher.voucherNumber);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCardImage = async () => {
    try {
      let blob = cardBlob;
      if (!blob) {
        blob = await generateVirtualCardBlob(voucher);
        setCardBlob(blob);
      }
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedImage(true);
        setShareNotice('Card image copied to clipboard! Paste (⌘V / Ctrl+V) directly into WhatsApp chat.');
        setTimeout(() => {
          setCopiedImage(false);
          setShareNotice(null);
        }, 5000);
      }
    } catch (e) {
      console.warn('Could not copy image to clipboard:', e);
      setShareNotice('Could not copy image directly. Use "Download Card" or "Share on WhatsApp".');
    }
  };

  const handleDownloadCard = async () => {
    setIsProcessingShare(true);
    try {
      let blob = cardBlob;
      if (!blob) {
        blob = await generateVirtualCardBlob(voucher);
        setCardBlob(blob);
      }
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

  const handlePrint = () => {
    window.print();
  };

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
║  Settlement Hotline: +91 94378 60479      ║
║  Settle against invoice / cash payout.    ║
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
      let blob = cardBlob;
      if (!blob) {
        blob = await generateVirtualCardBlob(voucher);
        setCardBlob(blob);
      }

      // 1. Copy image to clipboard for quick paste in WhatsApp Web/Desktop
      try {
        if (navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedImage(true);
        }
      } catch (clipErr) {
        console.warn('Clipboard write image failed:', clipErr);
      }

      // 2. Check native Web Share with image file (Mobile WhatsApp)
      const file = new File(
        [blob],
        `FILTEC-Virtual-Card-${voucher.voucherNumber}.png`,
        { type: 'image/png' }
      );

      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
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

      // 3. Fallback: Launch WhatsApp web / app with formatted text + direct card link
      const clean = recipientPhone.replace(/\D/g, '');
      const finalPhone = clean.length === 10 ? `91${clean}` : clean;
      const text = getWhatsAppCardMessage();
      const waUrl = finalPhone
        ? `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;

      window.open(waUrl, '_blank');

      setShareNotice(
        'Card image copied to clipboard! Simply press Paste (⌘V or Ctrl+V) in WhatsApp to send the image.'
      );
    } catch (err) {
      console.error('Error sharing to WhatsApp:', err);
    } finally {
      setIsProcessingShare(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto select-none print:m-0 print:max-w-none space-y-4">
      {/* 1. ULTRA-PREMIUM VIRTUAL CARD */}
      <div
        className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl p-5 sm:p-6 text-white border transition-all duration-300 ${
          isDealer
            ? 'bg-gradient-to-br from-[#4A0A0A] via-[#881313] to-[#DC2626] border-amber-400/50 shadow-red-950/40'
            : 'bg-gradient-to-br from-[#0A1128] via-[#1C3782] to-[#2563EB] border-sky-300/40 shadow-blue-950/40'
        }`}
        style={{ minHeight: '240px' }}
      >
        {/* Subtle holographic radial sheen overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />

        {/* Top Header Row: Brand & Badge */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm flex items-center justify-center">
              <img
                src="/brand/filtec-one-logo.png"
                alt="f | ONE"
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-white/95 block leading-tight">
                FILTEC Polyplast
              </span>
              <span className="text-[9px] font-mono text-white/70 block">
                {isDealer ? 'OFFICIAL DEALER VOUCHER' : 'OFFICIAL PLUMBER COUPON'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-xs ${
                isDealer
                  ? 'bg-amber-400 text-neutral-900 border-amber-300'
                  : 'bg-sky-300 text-neutral-900 border-sky-200'
              }`}
            >
              {isDealer ? 'DEALER 75%' : 'PLUMBER 25%'}
            </span>
          </div>
        </div>

        {/* Middle Row: EMV Chip, Contactless Icon, & Value */}
        <div className="relative z-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Realistic Golden EMV Chip */}
            <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 border border-amber-300/80 shadow-inner relative flex items-center justify-center overflow-hidden">
              <div className="w-full h-[1px] bg-amber-700/40 absolute top-2.5" />
              <div className="w-full h-[1px] bg-amber-700/40 absolute bottom-2.5" />
              <div className="h-full w-[1px] bg-amber-700/40 absolute left-3.5" />
              <div className="h-full w-[1px] bg-amber-700/40 absolute right-3.5" />
              <div className="w-3.5 h-3 rounded-xs border border-amber-700/50 bg-amber-300/60" />
            </div>

            {/* Contactless Waves */}
            <Wifi className="w-5 h-5 text-white/70 rotate-90" />
          </div>

          {/* Cash Redeem Value Box */}
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-white/75 font-semibold block tracking-wider">
              REDEEM CASH VALUE
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-black text-white drop-shadow-sm tracking-tight">
              ₹{voucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] font-mono text-white/80">
              ({voucher.points.toLocaleString('en-IN')} Incentive Points)
            </span>
          </div>
        </div>

        {/* Card Number & Beneficiary */}
        <div className="relative z-10 pt-1 space-y-2">
          {/* Card Code */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-mono font-bold tracking-widest text-white drop-shadow-xs">
                {voucher.voucherNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy Voucher Code"
                className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                {copiedCode ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <span className="text-[10px] font-mono text-white/80">
              EXP: NO EXPIRY
            </span>
          </div>

          {/* Beneficiary Name & Hotline Footer */}
          <div className="flex items-end justify-between gap-2 text-xs pt-2 border-t border-white/15">
            <div>
              <span className="text-[9px] font-mono uppercase text-white/70 block font-medium">
                {isDealer ? 'DEALER BENEFICIARY' : 'PLUMBER BENEFICIARY'}
              </span>
              <div className="font-bold text-sm text-white truncate max-w-[220px]">
                {isDealer ? voucher.dealerName : (voucher.plumberName || 'PLUMBER 1')}
              </div>
              {!isDealer && voucher.dealerName && (
                <div className="text-[10px] text-white/80">
                  Via: {voucher.dealerName}
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="text-[9px] font-mono uppercase text-white/70 block font-medium">
                SETTLEMENT HOTLINE
              </span>
              <div className="font-mono font-bold text-xs text-amber-200">
                +91 94378 60479
              </div>
              <div className="text-[10px] text-white/80 font-mono">
                {voucher.dateRedeemed}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share / Copy Notice */}
      {shareNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{shareNotice}</span>
        </div>
      )}

      {/* 2. DIRECT WHATSAPP SHARING CONTROLS */}
      {showActions && (
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Send Virtual Card to WhatsApp:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+91 94378 60479"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#25D366] bg-white text-neutral-900"
              />
            </div>
          </div>

          {/* Primary Action Button: WhatsApp */}
          <button
            type="button"
            disabled={isProcessingShare}
            onClick={handleWhatsAppShare}
            className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isProcessingShare ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>
              Share Card on WhatsApp {recipientPhone ? `(${recipientPhone})` : ''}
            </span>
          </button>

          {/* Secondary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isProcessingShare}
              onClick={handleDownloadCard}
              className="flex-1 min-w-[120px] py-2 px-3 rounded-lg border border-neutral-300 hover:bg-neutral-100 bg-white text-neutral-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-neutral-600" />
              <span>Download PNG</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCardImage}
              className="flex-1 min-w-[120px] py-2 px-3 rounded-lg border border-neutral-300 hover:bg-neutral-100 bg-white text-neutral-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedImage ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-neutral-600" />
              )}
              <span>{copiedImage ? 'Image Copied!' : 'Copy Card Image'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2 px-3 rounded-lg border border-neutral-300 hover:bg-neutral-100 bg-white text-neutral-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Print Voucher"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all cursor-pointer shadow-xs ml-auto"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
