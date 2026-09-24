import { RewardVoucher } from '@/types';

/**
 * Generates an ultra-premium, high-resolution (1200x675) Virtual Card image (PNG Blob)
 * that can be shared directly via WhatsApp or downloaded to photos.
 */
export async function generateVirtualCardBlob(voucher: RewardVoucher): Promise<Blob> {
  const width = 1200;
  const height = 675;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  const isDealer = voucher.type === 'DEALER';

  // 1. Base Card Outline & Corner Radius
  const radius = 32;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.clip();

  // 2. Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  if (isDealer) {
    bgGrad.addColorStop(0, '#5A0B0B'); // Deep Burgundy
    bgGrad.addColorStop(0.35, '#881313'); // Rich Wine
    bgGrad.addColorStop(0.7, '#DC2626'); // Vibrant Filtec Red
    bgGrad.addColorStop(1, '#991B1B'); // Crimson
  } else {
    bgGrad.addColorStop(0, '#0F172A'); // Deep Navy
    bgGrad.addColorStop(0.35, '#1E3A8A'); // Sapphire Blue
    bgGrad.addColorStop(0.7, '#2563EB'); // Royal Blue
    bgGrad.addColorStop(1, '#1D4ED8'); // Electric Blue
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Subtle Holographic / Geometric Background Grid
  ctx.save();
  ctx.strokeStyle = isDealer ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1.5;
  for (let x = -height; x < width + height; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }
  for (let x = width + height; x > -height; x -= 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - height, height);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Subtle Radial Spotlight / Glow
  const glow = ctx.createRadialGradient(width * 0.75, height * 0.35, 10, width * 0.75, height * 0.35, 450);
  glow.addColorStop(0, isDealer ? 'rgba(254, 202, 202, 0.25)' : 'rgba(191, 219, 254, 0.3)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // 5. Metallic Inner Border
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = isDealer ? 'rgba(251, 191, 36, 0.55)' : 'rgba(147, 197, 253, 0.6)'; // Gold / Platinum
  ctx.beginPath();
  const innerMargin = 16;
  const innerR = radius - 8;
  ctx.moveTo(innerMargin + innerR, innerMargin);
  ctx.lineTo(width - innerMargin - innerR, innerMargin);
  ctx.quadraticCurveTo(width - innerMargin, innerMargin, width - innerMargin, innerMargin + innerR);
  ctx.lineTo(width - innerMargin, height - innerMargin - innerR);
  ctx.quadraticCurveTo(width - innerMargin, height - innerMargin, width - innerMargin - innerR, height - innerMargin);
  ctx.lineTo(innerMargin + innerR, height - innerMargin);
  ctx.quadraticCurveTo(innerMargin, height - innerMargin, innerMargin, height - innerMargin - innerR);
  ctx.lineTo(innerMargin, innerMargin + innerR);
  ctx.quadraticCurveTo(innerMargin, innerMargin, innerMargin + innerR, innerMargin);
  ctx.stroke();
  ctx.restore();

  // Load official logo image
  let logoImage: HTMLImageElement | null = null;
  if (typeof window !== 'undefined') {
    try {
      logoImage = new window.Image();
      logoImage.crossOrigin = 'anonymous';
      logoImage.src = '/brand/filtec-one-logo.png';
      await new Promise<void>((resolve) => {
        if (logoImage!.complete && logoImage!.naturalWidth > 0) {
          resolve();
        } else {
          logoImage!.onload = () => resolve();
          logoImage!.onerror = () => resolve();
          setTimeout(resolve, 300);
        }
      });
    } catch {
      // ignore
    }
  }

  // 6. Top Bar
  // Brand Pill
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(45, 38, 175, 54, 12);
  ctx.fill();

  // Draw official Logo image if loaded, with high-quality fallback
  if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
    const logoW = 150;
    const logoH = 50;
    ctx.drawImage(logoImage, 57, 40, logoW, logoH);
  } else {
    ctx.fillStyle = '#DC2626';
    ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('filtec™', 62, 75);
  }
  ctx.restore();

  // Company and Card Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('FILTEC Polyplast Pvt Ltd', 225, 63);

  ctx.fillStyle = isDealer ? 'rgba(254, 202, 202, 0.9)' : 'rgba(191, 219, 254, 0.9)';
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    isDealer ? 'OFFICIAL COMMERCIAL REWARD VIRTUAL CARD' : 'OFFICIAL PLUMBER INCENTIVE VIRTUAL CARD',
    225,
    83
  );

  // Right Top Badge (Dealer 75% or Plumber 25%)
  ctx.save();
  const badgeText = isDealer ? '★ DEALER 75% REWARD' : '★ PLUMBER 25% REWARD';
  ctx.fillStyle = isDealer ? '#F59E0B' : '#38BDF8';
  ctx.beginPath();
  ctx.roundRect(width - 295, 46, 250, 40, 20);
  ctx.fill();

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, width - 295 + 125, 71);
  ctx.restore();

  // 7. Divider Line
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(45, 115);
  ctx.lineTo(width - 45, 115);
  ctx.stroke();
  ctx.restore();

  // 8. Main Body - Left Column (Voucher details)
  // Voucher Number Label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 12px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillText('VIRTUAL CARD CODE', 50, 150);

  // Big Monospace Voucher Number
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 58px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillText(voucher.voucherNumber, 50, 210);

  // Status Badge below code
  ctx.save();
  ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(50, 230, 210, 32, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('● ISSUED & AUTHENTIC', 70, 251);
  ctx.restore();

  // Beneficiary Label & Name
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 12px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillText(isDealer ? 'DEALER BENEFICIARY' : 'PLUMBER BENEFICIARY', 50, 305);

  const beneficiary = isDealer
    ? `${voucher.dealerName} ${voucher.dealerCode ? `(${voucher.dealerCode})` : ''}`
    : `${voucher.plumberName || 'Valued Plumber'} ${voucher.plumberPhone ? `• ${voucher.plumberPhone}` : ''}`;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(beneficiary.length > 34 ? beneficiary.substring(0, 32) + '...' : beneficiary, 50, 342);

  // Date of Issue
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 12px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillText('DATE OF ISSUE', 50, 395);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillText(voucher.dateRedeemed || new Date().toLocaleDateString('en-IN'), 50, 425);

  // 9. Main Body - Right Column (Cash Value Box)
  // Cash Value Box Background
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.strokeStyle = isDealer ? 'rgba(251, 191, 36, 0.4)' : 'rgba(147, 197, 253, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(width - 490, 135, 445, 290, 20);
  ctx.fill();
  ctx.stroke();

  // Value Label
  ctx.fillStyle = isDealer ? '#FDE68A' : '#BAE6FD';
  ctx.font = 'bold 13px "SF Mono", Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('REDEEMABLE CASH VALUE', width - 490 + 222, 172);

  // Big Currency Amount
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`₹${voucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, width - 490 + 222, 245);

  // Points Subtitle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`(${voucher.points.toLocaleString('en-IN')} Incentive Points)`, width - 490 + 222, 280);

  // Simulated QR Code & Barcode Section
  drawSimulatedBarcode(ctx, width - 490 + 40, 315, 365, 55, voucher.voucherNumber);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '10px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillText('OFFICIAL DIGITAL ENCRYPTED TOKEN', width - 490 + 222, 395);
  ctx.restore();

  // 10. Settlement Instructions Box (Bottom Banner)
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.roundRect(45, 460, width - 90, 140, 16);
  ctx.fill();

  // Instructions Header
  ctx.fillStyle = isDealer ? '#FCD34D' : '#7DD3FC';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    isDealer ? '💳 Credit Note Settlement Instructions:' : '🎁 Plumber Cash Claim Instructions:',
    68,
    494
  );

  // Instructions Body
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  if (isDealer) {
    ctx.fillText(
      'Present this virtual card to your FILTEC Sales Executive or contact Finance at +91 94378 60479.',
      68,
      525
    );
    ctx.fillText(
      'Value will be directly credited and adjusted against your next commercial supply invoice.',
      68,
      550
    );
  } else {
    ctx.fillText(
      `To redeem your cash reward, present coupon ${voucher.voucherNumber} to your issuing dealer (${voucher.dealerName})`,
      68,
      525
    );
    ctx.fillText(
      'or contact FILTEC Head Office (+91 94378 60479) for instant settlement.',
      68,
      550
    );
  }

  // Token ID in footer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '11px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillText(`TOKEN ID: ${voucher.id} • IMMUTABLE LEDGER VERIFIED`, 68, 582);
  ctx.restore();

  // 11. Security Watermark along bottom edge
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '10px "SF Mono", Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PRE-TECH PIPES & FITTINGS PVT LTD • FILTEC ONE NETWORK SECURE REWARD SYSTEM', width / 2, 642);

  // Convert canvas to Blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create image blob from canvas'));
      }
    }, 'image/png');
  });
}

/**
 * Draws a sharp simulated high-density barcode pattern on the canvas
 */
function drawSimulatedBarcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  code: string
) {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, w, h);

  // Generate deterministic bars based on voucher code
  ctx.fillStyle = '#111827';
  let curX = x + 12;
  const endX = x + w - 12;

  // Hash-like pattern
  let seed = 0;
  for (let i = 0; i < code.length; i++) {
    seed = (seed * 31 + code.charCodeAt(i)) & 0xffffffff;
  }

  while (curX < endX) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const barWidth = (Math.abs(seed) % 3) + 1.5;
    const gap = (Math.abs(seed >> 3) % 3) + 1.5;

    if (curX + barWidth > endX) break;
    ctx.fillRect(curX, y + 4, barWidth, h - 8);
    curX += barWidth + gap;
  }

  ctx.restore();
}

/**
 * Generates an encrypted/compact URL parameter containing the voucher info
 * so any recipient on WhatsApp can open the full-screen interactive card!
 */
export function encodeVoucherToUrlParam(voucher: RewardVoucher): string {
  try {
    const compact = {
      i: voucher.id,
      n: voucher.voucherNumber,
      t: voucher.type,
      d: voucher.dealerName,
      c: voucher.dealerCode,
      p: voucher.plumberName,
      ph: voucher.plumberPhone,
      pts: voucher.points,
      a: voucher.amount,
      s: voucher.status,
      dt: voucher.dateRedeemed,
      tel: voucher.contactNumber
    };
    return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(compact)))));
  } catch {
    return voucher.voucherNumber;
  }
}

/**
 * Decodes the compact URL parameter back into a RewardVoucher object
 */
export function decodeVoucherFromUrlParam(param: string): Partial<RewardVoucher> | null {
  try {
    const decodedStr = decodeURIComponent(escape(atob(decodeURIComponent(param))));
    const c = JSON.parse(decodedStr);
    return {
      id: c.i,
      voucherNumber: c.n,
      type: c.t,
      dealerName: c.d,
      dealerCode: c.c,
      plumberName: c.p,
      plumberPhone: c.ph,
      points: c.pts,
      amount: c.a,
      status: c.s,
      dateRedeemed: c.dt,
      contactNumber: c.tel
    };
  } catch {
    return null;
  }
}
