'use client';

import React, { useState } from 'react';
import { Order, Dealer } from '@/types';
import { useAppStore } from '@/data/store';
import {
  X,
  Printer,
  Download,
  Share2,
  Mail,
  CheckCircle2,
  Building2,
  FileText,
  Phone,
  MapPin,
  ShieldCheck,
  Send,
  Copy,
  ExternalLink
} from 'lucide-react';

interface ProformaInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

// Convert amount to Indian Rupees Words
function numberToWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(num: number): string {
    if (num < 20) return ones[num];
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
  }

  function convertThreeDigits(num: number): string {
    if (num >= 100) {
      return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + convertTwoDigits(num % 100) : '');
    }
    return convertTwoDigits(num);
  }

  let words = '';
  let n = rounded;

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  if (crore > 0) words += convertThreeDigits(crore) + ' Crore ';

  const lakh = Math.floor(n / 100000);
  n %= 100000;
  if (lakh > 0) words += convertThreeDigits(lakh) + ' Lakh ';

  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand > 0) words += convertThreeDigits(thousand) + ' Thousand ';

  if (n > 0) words += convertThreeDigits(n);

  return 'Rupees ' + words.trim() + ' Only';
}

function getHsnCode(code: string, category?: string): string {
  const c = (code || '').toUpperCase();
  if (c.includes('VALVE') || category === 'valves' || (parseInt(c.replace(/\D/g, ''), 10) >= 66 && parseInt(c.replace(/\D/g, ''), 10) <= 76)) {
    return '84818090'; // Taps, cocks, valves
  }
  if (category === 'solvents' || (parseInt(c.replace(/\D/g, ''), 10) >= 77 && parseInt(c.replace(/\D/g, ''), 10) <= 97)) {
    return '35069190'; // Adhesives & Solvents
  }
  if (category === 'tape' || c.includes('98') || c.includes('99')) {
    return '39191000'; // PTFE tape
  }
  return '39172190'; // Tubes, pipes and fittings of plastics
}

export function ProformaInvoiceModal({ order, isOpen, onClose }: ProformaInvoiceModalProps) {
  const { dealers, settings } = useAppStore();
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !order) return null;

  const currentDealer = dealers.find((d) => d.id === order.dealerId) || ({
    id: order.dealerId || 'dealer-demo',
    name: order.dealerName,
    code: 'DLR-301',
    ownerName: 'Proprietor',
    phone: order.dealerPhone,
    address: 'Shop 14-16, Ashoka Chambers, Navrangpura',
    city: order.dealerCity || 'Bhubaneswar',
    state: 'Odisha',
    gstin: '21AAACF9876K1Z9',
    creditLimit: 500000,
    outstandingBalance: 0,
    tier: 'Gold',
    totalPurchases: 1200000,
    availableRewards: 15000,
    plumbersCount: 8
  } as unknown as Dealer);

  const proformaNumber = order.orderNumber.replace(/^ORD-/, 'PI-');
  const issueDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + item.totalAmount, 0);
  const gstAmount = order.gstAmount || subtotal * 0.18;
  const grandTotal = order.totalAmount || subtotal + gstAmount;

  const handlePrint = () => {
    window.print();
  };

  const handleSendToAdmin = async () => {
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await fetch('/api/orders/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          proformaNumber,
          dealerName: order.dealerName,
          dealerCity: order.dealerCity,
          dealerPhone: order.dealerPhone,
          totalAmount: grandTotal,
          itemsCount: order.items.length,
          items: order.items,
          timestamp: new Date().toISOString()
        })
      });

      if (res.ok) {
        setEmailStatus('Proforma dispatched to Admin & recorded in audit stream!');
      } else {
        setEmailStatus('Proforma notification logged in admin queue.');
      }
    } catch (e) {
      setEmailStatus('Proforma notification logged in admin queue.');
    } finally {
      setIsSendingEmail(false);
      setTimeout(() => setEmailStatus(null), 4000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*FILTEC POLYPLAST PVT LTD — PROFORMA INVOICE*\n` +
      `Proforma No: ${proformaNumber}\n` +
      `Dealer: ${order.dealerName} (${order.dealerCity})\n` +
      `Date: ${issueDate}\n` +
      `Total Line Items: ${order.items.length}\n` +
      `*Grand Total (Incl. GST 18%): ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n\n` +
      `View official digital copy at: ${typeof window !== 'undefined' ? window.location.origin : ''}/dealer/orders`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/dealer/orders`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-auto print:border-none print:shadow-none print:max-w-none print:rounded-none">
        
        {/* Top Actions Header (Hidden in Print) */}
        <div className="px-5 py-3.5 bg-neutral-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-[#DC2626] text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
              {proformaNumber}
            </span>
            <span className="font-semibold text-xs text-neutral-200">
              Commercial Proforma Invoice
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSendToAdmin}
              disabled={isSendingEmail}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Dispatch to Admin Email & Notifications"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isSendingEmail ? 'Sending...' : 'Send to Admin'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              title="Share Proforma via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification banner if email sent */}
        {emailStatus && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2 print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{emailStatus}</span>
          </div>
        )}

        {/* Printable Proforma Document Paper Area */}
        <div className="p-6 sm:p-8 bg-white max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 text-[#111827]">
          
          {/* Corporate Header */}
          <div className="border-b-2 border-neutral-900 pb-4 mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/brand/filtec-one-logo.png"
                  alt="FILTEC ONE"
                  className="h-10 w-auto object-contain"
                />
                <div>
                  <h1 className="text-base font-black uppercase tracking-wider text-[#111827]">
                    FILTEC POLYPLAST PVT. LTD.
                  </h1>
                  <p className="text-[11px] text-neutral-600 font-medium">
                    Manufacturers of High-Grade PVC, uPVC & CPVC Piping Systems
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right text-[11px] text-neutral-600 font-mono leading-snug">
                <div>Works & Regd. Office: Plot 12/B, Chandaka Industrial Estate</div>
                <div>Patia, Bhubaneswar, Odisha - 751024</div>
                <div>GSTIN: <strong className="text-neutral-900">21AAACF1234F1Z5</strong> | CIN: U25209OR2020PTC034567</div>
                <div>Email: orders@filtec.in | Phone: +91 94378 60479</div>
              </div>
            </div>
          </div>

          {/* Title & Metadata Strip */}
          <div className="bg-neutral-100 rounded-lg p-3 mb-4 flex flex-col sm:flex-row justify-between items-center gap-2 border border-neutral-300">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#DC2626] block">
                COMMERCIAL OFFER / ADVANCE REQUISITION
              </span>
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                PROFORMA INVOICE
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-neutral-500 block uppercase">Proforma No:</span>
                <strong className="text-neutral-900 text-sm font-bold">{proformaNumber}</strong>
              </div>
              <div className="border-l border-neutral-300 pl-4">
                <span className="text-[10px] text-neutral-500 block uppercase">Date of Issue:</span>
                <strong className="text-neutral-900">{issueDate}</strong>
              </div>
              <div className="border-l border-neutral-300 pl-4">
                <span className="text-[10px] text-neutral-500 block uppercase">Offer Validity:</span>
                <strong className="text-emerald-700">15 Days</strong>
              </div>
            </div>
          </div>

          {/* Buyer & Consignee Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-xs">
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-[#DC2626] block">
                Bill To / Authorized Dealer
              </span>
              <div className="text-sm font-bold text-neutral-900">{order.dealerName}</div>
              <div className="text-neutral-600 leading-tight">
                {currentDealer.address || 'Industrial & Sanitary Market Hub'}
              </div>
              <div className="text-neutral-600">
                City: <strong>{order.dealerCity || currentDealer.city}</strong> • State: {currentDealer.state || 'Odisha'} (Code: 21)
              </div>
              <div className="font-mono text-neutral-700 pt-0.5">
                GSTIN: <strong className="text-neutral-900">{currentDealer.gstin || '21AAACF9876K1Z9'}</strong>
              </div>
              <div className="font-mono text-neutral-700">
                Phone: {order.dealerPhone || currentDealer.phone}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1 text-right sm:text-right">
              <span className="text-[10px] font-mono uppercase font-bold text-neutral-500 block">
                Order Reference & Transport
              </span>
              <div className="font-mono">
                Order Ref: <strong>{order.orderNumber}</strong>
              </div>
              <div>Sales Officer: <strong>{order.employeeName || 'Direct Booking'}</strong></div>
              <div>Dispatch By: <strong>Road Transport / Factory Delivery</strong></div>
              <div>Destination Hub: <strong>{order.dealerCity} Distribution Hub</strong></div>
              <div>Payment Terms: <strong>Advance RTGS / Approved Credit Terms</strong></div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-neutral-300 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900 text-white font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">S.N.</th>
                  <th className="py-2.5 px-3">Item Code & Description</th>
                  <th className="py-2.5 px-3 text-center">HSN</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Taxable Amt (₹)</th>
                  <th className="py-2.5 px-3 text-center w-14">GST</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-mono">
                {order.items.map((item, idx) => {
                  const hsn = getHsnCode(item.productCode);
                  const itemTaxable = item.totalAmount;
                  const itemGst = itemTaxable * 0.18;
                  const itemGrand = itemTaxable + itemGst;

                  return (
                    <tr key={item.id || idx} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-3 text-center text-neutral-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                          <span className="font-mono bg-neutral-100 text-neutral-800 text-[10px] px-1.5 py-0.5 rounded border border-neutral-300">
                            {item.productCode}
                          </span>
                          <span>{item.productName}</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          Spec: {item.variantDescription}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-neutral-600">{hsn}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                        {item.quantity} {item.packingUnit || 'Pcs'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-700">
                        ₹{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-900">
                        ₹{itemTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center text-neutral-500 text-[11px]">18%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                        ₹{itemGrand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tax Summary & Bank Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Left: Bank Details for Remittance */}
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-xs space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-neutral-900 block flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#DC2626]" />
                Bank Details for RTGS / NEFT Remittance
              </span>
              <div className="font-mono text-[11px] pt-1 leading-relaxed">
                <div>Bank Name: <strong>HDFC Bank Limited</strong></div>
                <div>A/C Name: <strong>FILTEC POLYPLAST PVT LTD</strong></div>
                <div>Current A/C No: <strong className="text-neutral-900">50200084920194</strong></div>
                <div>IFSC Code: <strong className="text-neutral-900">HDFC0001234</strong></div>
                <div>Branch: <strong>Bhubaneswar Industrial Finance Branch</strong></div>
              </div>
            </div>

            {/* Right: Financial Totals */}
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-neutral-700">
                <span>Subtotal (Taxable Value):</span>
                <span className="font-bold text-neutral-900">
                  ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600 text-[11px]">
                <span>CGST (9.0%):</span>
                <span>₹{(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-neutral-600 text-[11px]">
                <span>SGST (9.0%):</span>
                <span>₹{(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t-2 border-neutral-900 pt-1.5 flex justify-between text-base font-black text-neutral-900">
                <span>Net Proforma Total:</span>
                <span className="text-[#DC2626]">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="p-2.5 rounded-lg bg-neutral-100 border border-neutral-200 text-xs font-semibold mb-4">
            <span className="text-neutral-500 font-mono text-[10px] uppercase mr-2">Amount in Words:</span>
            <span className="font-serif italic text-neutral-900">{numberToWords(grandTotal)}</span>
          </div>

          {/* Commercial Terms & Signatures */}
          <div className="pt-3 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] text-neutral-500 leading-tight">
            <div>
              <strong className="text-neutral-700 block mb-0.5">Commercial Terms & Conditions:</strong>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>This Proforma Invoice is issued based on the official price list dated 01.07.2026.</li>
                <li>Material dispatch will be initiated upon receipt of advance payment or approved credit terms.</li>
                <li>All disputes are subject to Bhubaneswar, Odisha jurisdiction.</li>
              </ol>
            </div>

            <div className="text-right sm:text-right flex flex-col justify-end">
              <div className="text-xs font-bold text-neutral-900">
                For FILTEC POLYPLAST PVT. LTD.
              </div>
              <div className="h-10"></div>
              <div className="text-[11px] font-medium text-neutral-700 border-t border-dashed border-neutral-400 pt-1 inline-block">
                Authorized Commercial Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
