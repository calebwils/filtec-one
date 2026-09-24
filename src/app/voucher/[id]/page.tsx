'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { RewardVoucher } from '@/types';
import { useAppStore } from '@/data/store';
import {
  generateVirtualCardBlob,
  decodeVoucherFromUrlParam
} from '@/utils/virtualCardGenerator';
import {
  Share2,
  Download,
  Phone,
  CheckCircle2,
  Copy,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function VirtualCardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const voucherId = (params?.id as string) || searchParams?.get('id') || '';
  const encodedData = searchParams?.get('d');

  const { rewardVouchers } = useAppStore();
  const [voucher, setVoucher] = useState<RewardVoucher | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    // 1. Try decoding from URL parameter if present
    if (encodedData) {
      const decoded = decodeVoucherFromUrlParam(encodedData);
      if (decoded && decoded.voucherNumber) {
        setVoucher({
          id: decoded.id || `vouch-${decoded.voucherNumber}`,
          voucherNumber: decoded.voucherNumber,
          type: decoded.type || 'DEALER',
          dealerId: decoded.dealerId || 'dlr-auto',
          dealerName: decoded.dealerName || 'Authorized Partner',
          dealerCode: decoded.dealerCode,
          plumberName: decoded.plumberName,
          plumberPhone: decoded.plumberPhone,
          points: decoded.points || 0,
          amount: decoded.amount || 0,
          status: (decoded.status as any) || 'ISSUED',
          dateRedeemed: decoded.dateRedeemed || new Date().toLocaleDateString('en-IN'),
          createdAt: new Date().toISOString(),
          contactNumber: decoded.contactNumber || '+91 94375 05814',
          instructions: ''
        });
        return;
      }
    }

    // 2. Try looking up in the store's vouchers
    const found = rewardVouchers.find(
      (v) =>
        v.voucherNumber.toLowerCase() === voucherId.toLowerCase() ||
        v.id.toLowerCase() === voucherId.toLowerCase()
    );
    if (found) {
      setVoucher(found);
      return;
    }

    // 3. Fallback mock if directly visited with just code (e.g. /voucher/D-001)
    if (voucherId) {
      const isDealerCode = voucherId.toUpperCase().startsWith('D-');
      setVoucher({
        id: `vouch-${voucherId}`,
        voucherNumber: voucherId.toUpperCase(),
        type: isDealerCode ? 'DEALER' : 'PLUMBER',
        dealerId: 'dlr-live',
        dealerName: 'Authorized FILTEC Partner',
        points: 500,
        amount: 500,
        status: 'ISSUED',
        dateRedeemed: new Date().toLocaleDateString('en-IN'),
        createdAt: new Date().toISOString(),
        contactNumber: '+91 94378 60479',
        instructions: ''
      });
    }
  }, [voucherId, encodedData, rewardVouchers]);

  const handleCopy = () => {
    if (!voucher) return;
    navigator.clipboard.writeText(voucher.voucherNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCard = async () => {
    if (!voucher) return;
    setIsGeneratingImage(true);
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
      console.error('Failed to download card:', e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShareToWhatsApp = async () => {
    if (!voucher) return;
    setIsGeneratingImage(true);
    try {
      const isDealer = voucher.type === 'DEALER';
      const text = isDealer
        ? `*FILTEC OFFICIAL REWARD VIRTUAL CARD*\n\n` +
          `💳 *Card Code:* ${voucher.voucherNumber}\n` +
          `💰 *Value:* ₹${voucher.amount.toLocaleString('en-IN')}\n` +
          `🏢 *Beneficiary:* ${voucher.dealerName}\n` +
          `📅 *Date:* ${voucher.dateRedeemed}\n` +
          `🛡️ *Status:* ${voucher.status}\n\n` +
          `📲 *View Authentic Card:* ${window.location.href}\n\n` +
          `Present this card for Credit Note settlement with FILTEC Finance (+91 94378 60479).`
        : `*FILTEC PLUMBER INCENTIVE VIRTUAL CARD*\n\n` +
          `🎟️ *Coupon Code:* ${voucher.voucherNumber}\n` +
          `💰 *Value:* ₹${voucher.amount.toLocaleString('en-IN')}\n` +
          `👤 *Beneficiary:* ${voucher.plumberName || 'Valued Plumber'}\n` +
          `🏢 *Dealer:* ${voucher.dealerName}\n` +
          `📅 *Date:* ${voucher.dateRedeemed}\n\n` +
          `📲 *View Authentic Card:* ${window.location.href}\n\n` +
          `Present to your dealer or contact FILTEC Head Office (+91 94378 60479) to redeem.`;

      const blob = await generateVirtualCardBlob(voucher);
      const file = new File([blob], `FILTEC-Card-${voucher.voucherNumber}.png`, { type: 'image/png' });

      // If Web Share API supports file sharing (mobile WhatsApp)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `FILTEC Virtual Card ${voucher.voucherNumber}`,
          text,
          files: [file]
        });
        return;
      }

      // Fallback: Download the image and open WhatsApp web/app
      await handleDownloadCard();
      const phone = !isDealer && voucher.plumberPhone ? voucher.plumberPhone.replace(/\D/g, '') : '';
      const url = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (e) {
      console.error('WhatsApp share error:', e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!voucher) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#DC2626]" />
      </div>
    );
  }

  const isDealer = voucher.type === 'DEALER';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#1E293B] text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm">
            <Image
              src="/brand/filtec-one-logo.png"
              alt="FILTEC ONE"
              width={100}
              height={26}
              className="h-6 w-auto object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              FILTEC ONE Network
            </h1>
            <p className="text-[10px] text-neutral-400 font-mono">
              Official Digital Rewards & Incentive Verification
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </header>

      {/* Main Virtual Card Container */}
      <main className="max-w-xl mx-auto w-full my-auto py-8">
        <div className="text-center mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AUTHENTIC DIGITAL VIRTUAL CARD</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-2 text-white">
            {isDealer ? 'Official Dealer Reward Card' : 'Official Plumber Incentive Card'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Issued by Pre-Tech Pipes & Fittings Pvt Ltd
          </p>
        </div>

        {/* 3D Glossy Virtual Card */}
        <div
          className={`relative rounded-3xl overflow-hidden shadow-2xl border-2 transition-all p-6 sm:p-7 backdrop-blur-xl ${
            isDealer
              ? 'bg-gradient-to-br from-[#7F1D1D] via-[#991B1B] to-[#B91C1C] border-amber-400/50 shadow-rose-950/60'
              : 'bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#1D4ED8] border-sky-400/50 shadow-blue-950/60'
          }`}
        >
          {/* Card Top Row */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/20">
            <div className="flex items-center gap-2.5">
              <div className="bg-white px-2.5 py-1 rounded-md shadow-xs">
                <span className="font-extrabold text-sm text-[#DC2626]">f | </span>
                <span className="font-black text-sm text-[#111827]">ONE</span>
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-white/90">
                FILTEC Polyplast
              </span>
            </div>

            <span
              className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                isDealer
                  ? 'bg-amber-400 text-neutral-950 shadow-xs'
                  : 'bg-sky-300 text-neutral-950 shadow-xs'
              }`}
            >
              {isDealer ? 'DEALER 75%' : 'PLUMBER 25%'}
            </span>
          </div>

          {/* Card Core Values */}
          <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Left: Code & Beneficiary */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-mono text-white/70 uppercase block font-bold tracking-wider">
                  VIRTUAL CARD CODE
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-white">
                    {voucher.voucherNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Copy Code"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-white/70 uppercase block font-semibold">
                  BENEFICIARY
                </span>
                <div className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                  {isDealer ? voucher.dealerName : voucher.plumberName}
                </div>
                {voucher.dealerCode && isDealer && (
                  <span className="text-[10px] font-mono text-white/80 bg-white/10 px-1.5 py-0.5 rounded">
                    {voucher.dealerCode}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Cash Value Box */}
            <div className="bg-black/30 border border-white/20 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-mono uppercase text-amber-200 block font-bold tracking-wider">
                REDEEM CASH VALUE
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-black text-white mt-1">
                ₹{voucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs font-mono text-white/80 mt-0.5">
                {voucher.points.toLocaleString('en-IN')} Incentive Points
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Cash Guarantee</span>
              </div>
            </div>
          </div>

          {/* Settlement Guidelines */}
          <div className="bg-white/10 rounded-xl p-3.5 text-xs text-white/95 leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isDealer ? 'Credit Note Settle Process:' : 'Plumber Claim Process:'}
              </span>
            </div>
            <p className="text-[11px] text-white/90">
              {isDealer
                ? 'Present this card to your FILTEC Sales Executive or WhatsApp Finance to adjust against your next supply invoice.'
                : `Present coupon ${voucher.voucherNumber} to your dealer (${voucher.dealerName}) or contact FILTEC Head Office for instant payout.`}
            </p>
          </div>

          {/* Footer Bar */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[10px] font-mono text-white/60">
            <span>ISSUED: {voucher.dateRedeemed}</span>
            <span>TOKEN: {voucher.id}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={isGeneratingImage}
            onClick={handleShareToWhatsApp}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingImage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>Send Virtual Card on WhatsApp</span>
          </button>

          <button
            type="button"
            disabled={isGeneratingImage}
            onClick={handleDownloadCard}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-[#111827] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download Card Image (PNG)</span>
          </button>
        </div>

        {/* Support Hotline */}
        <div className="mt-6 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
          <Phone className="w-3.5 h-3.5 text-neutral-500" />
          <span>FILTEC Head Office Helpline: </span>
          <a
            href="tel:+919437860479"
            className="font-mono font-bold text-white hover:underline"
          >
            +91 94378 60479
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-neutral-500 font-mono pt-6 border-t border-white/5">
        PRE-TECH PIPES & FITTINGS PVT LTD • FILTEC ONE REWARD ECOSYSTEM
      </footer>
    </div>
  );
}
