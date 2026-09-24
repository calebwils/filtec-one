import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code') || 'D-001';
    const amount = searchParams.get('amount') || '500';
    const points = searchParams.get('points') || amount;
    const name = searchParams.get('name') || 'Authorized Partner';
    const dealerCode = searchParams.get('dealerCode') || '';
    const date = searchParams.get('date') || new Date().toLocaleDateString('en-IN');
    const type = (searchParams.get('type') || 'DEALER').toUpperCase();
    const isDealer = type === 'DEALER';

    const numAmount = parseFloat(amount) || 0;
    const formattedAmount = `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '40px 48px',
            backgroundColor: isDealer ? '#7F1D1D' : '#1E3A8A',
            backgroundImage: isDealer
              ? 'linear-gradient(135deg, #5A0B0B 0%, #881313 40%, #DC2626 75%, #991B1B 100%)'
              : 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 40%, #2563EB 75%, #1D4ED8 100%)',
            fontFamily: 'sans-serif',
            color: 'white',
            borderRadius: '24px',
            border: isDealer ? '4px solid rgba(251, 191, 36, 0.6)' : '4px solid rgba(147, 197, 253, 0.6)',
            boxSizing: 'border-box'
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '8px 18px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${new URL(req.url).origin}/brand/filtec-one-logo.png`}
                  alt="f | ONE"
                  style={{ height: '32px', width: '96px', objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>FILTEC Polyplast Pvt Ltd</span>
                <span style={{ fontSize: '12px', color: isDealer ? '#FCA5A5' : '#BAE6FD', fontWeight: 600 }}>
                  {isDealer ? 'OFFICIAL DEALER REWARD VIRTUAL CARD' : 'OFFICIAL PLUMBER INCENTIVE VIRTUAL CARD'}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: isDealer ? '#F59E0B' : '#38BDF8',
                color: '#111827',
                padding: '8px 20px',
                borderRadius: '50px',
                fontWeight: 900,
                fontSize: '14px',
                display: 'flex'
              }}
            >
              {isDealer ? '★ DEALER 75%' : '★ PLUMBER 25%'}
            </div>
          </div>

          {/* Center Card Body */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
            {/* Left Column: Code & Beneficiary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '600px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '1px' }}>
                VIRTUAL CARD CODE
              </span>
              <span
                style={{
                  fontSize: '56px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: 'white',
                  letterSpacing: '2px',
                  lineHeight: 1
                }}
              >
                {code}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.25)',
                    border: '1.5px solid #10B981',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    color: '#34D399',
                    fontWeight: 700,
                    display: 'flex'
                  }}
                >
                  ● ISSUED & AUTHENTIC
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '12px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                  {isDealer ? 'DEALER BENEFICIARY' : 'PLUMBER BENEFICIARY'}
                </span>
                <span style={{ fontSize: '26px', fontWeight: 800, color: 'white', marginTop: '2px' }}>
                  {name} {dealerCode ? `(${dealerCode})` : ''}
                </span>
              </div>
            </div>

            {/* Right Column: Big Cash Value */}
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.32)',
                border: isDealer ? '2px solid rgba(251, 191, 36, 0.5)' : '2px solid rgba(147, 197, 253, 0.5)',
                borderRadius: '20px',
                padding: '24px 36px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '320px'
              }}
            >
              <span style={{ fontSize: '13px', color: isDealer ? '#FDE68A' : '#BAE6FD', fontWeight: 800, letterSpacing: '1px' }}>
                REDEEM CASH VALUE
              </span>
              <span style={{ fontSize: '58px', fontWeight: 900, color: 'white', margin: '4px 0', lineHeight: 1 }}>
                {formattedAmount}
              </span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                ({points} Incentive Points)
              </span>
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '11px',
                  color: '#34D399',
                  fontWeight: 700,
                  display: 'flex'
                }}
              >
                ✓ 100% Cash Value Guaranteed
              </div>
            </div>
          </div>

          {/* Footer Instructions Box */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              padding: '14px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: isDealer ? '#FDE68A' : '#BAE6FD' }}>
                {isDealer ? '💳 Credit Note Settlement Instructions:' : '🎁 Plumber Cash Claim Instructions:'}
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
                DATE: {date}
              </span>
            </div>
            <span style={{ fontSize: '13px', color: 'white', lineHeight: '1.4' }}>
              {isDealer
                ? 'Present this virtual card to your FILTEC Area Sales Executive or contact Finance at +91 94378 60479 to adjust against your next billing invoice.'
                : 'Present coupon to your dealer or contact FILTEC Head Office (+91 94378 60479) for instant UPI / cash payout.'}
            </span>
          </div>
        </div>
      ),
      {
        width: 1000,
        height: 560
      }
    );
  } catch (error: any) {
    return new Response(`Failed to generate card image: ${error.message}`, { status: 500 });
  }
}
