import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User, Role } from '@/types';
import { checkRateLimit } from '@/lib/rateLimit';
import { hashPassword, createSessionToken, SESSION_MAX_AGE_SECONDS } from '@/lib/security';

function extractDigits(str: string): string {
  return (str || '').replace(/\D/g, '');
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    // Rate limit: 6 registration attempts per minute per IP
    const rl = checkRateLimit(`register:${ip}`, 6, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many registration attempts. Please wait ${rl.resetInSec} seconds before trying again.`
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      role,
      name,
      ownerName,
      phone,
      password,
      city,
      state,
      address,
      pincode,
      gstin,
      designation,
      territory,
      email
    } = body;

    if (role === 'EMPLOYEE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Employees cannot self-register. Staff accounts can only be onboarded directly by an administrator.'
        },
        { status: 403 }
      );
    }

    if (role !== 'DEALER') {
      return NextResponse.json(
        { success: false, error: 'Registration is currently available for Dealership accounts only.' },
        { status: 400 }
      );
    }

    if (!phone || extractDigits(phone).length < 5) {
      return NextResponse.json(
        { success: false, error: 'A valid phone number is required.' },
        { status: 400 }
      );
    }

    if (!password || password.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 5 characters long.' },
        { status: 400 }
      );
    }

    const inputDigits = extractDigits(phone);
    const inputLast10 = inputDigits.slice(-10);
    const formattedPhone = phone.trim().startsWith('+91')
      ? phone.trim()
      : `+91 ${inputLast10.slice(0, 5)} ${inputLast10.slice(5)}`;

    const hashedPassword = hashPassword(password.trim());

    // 1. REGISTER DEALERSHIP
    if (role === 'DEALER') {
      if (!name || !name.trim()) {
        return NextResponse.json(
          { success: false, error: 'Dealership / Firm name is required.' },
          { status: 400 }
        );
      }

      // Check if phone already registered as dealer
      const allDealers = await prisma.dealer.findMany({ select: { id: true, phone: true, password: true } });
      const duplicateDealer = allDealers.find((d) => {
        const dDigits = extractDigits(d.phone);
        return dDigits.slice(-10) === inputLast10;
      });

      if (duplicateDealer && duplicateDealer.password) {
        return NextResponse.json(
          { success: false, error: 'A dealership account with this phone number is already registered. Please sign in.' },
          { status: 409 }
        );
      }

      let activeDealer;

      if (duplicateDealer) {
        // Pre-existing dealership record claiming / activating account with a personal password
        activeDealer = await prisma.dealer.update({
          where: { id: duplicateDealer.id },
          data: {
            name: name.trim(),
            ownerName: (ownerName || name).trim(),
            password: hashedPassword,
            mustChangePassword: false,
            ...(city?.trim() ? { city: city.trim() } : {}),
            ...(state?.trim() ? { state: state.trim() } : {}),
            ...(address?.trim() ? { address: address.trim() } : {}),
            ...(pincode?.trim() ? { pincode: pincode.trim() } : {}),
            ...(gstin?.trim() ? { gstin: gstin.trim() } : {})
          }
        });
      } else {
        // Generate unique dealer code
        const count = await prisma.dealer.count();
        let nextCodeNum = count + 1;
        let candidateCode = `DLR-${String(nextCodeNum).padStart(3, '0')}`;
        while (await prisma.dealer.findUnique({ where: { code: candidateCode } })) {
          nextCodeNum++;
          candidateCode = `DLR-${String(nextCodeNum).padStart(3, '0')}`;
        }

        const dealerId = `dlr-${Date.now()}`;
        activeDealer = await prisma.dealer.create({
          data: {
            id: dealerId,
            code: candidateCode,
            name: name.trim(),
            ownerName: (ownerName || name).trim(),
            phone: formattedPhone,
            email: email?.trim() || `${candidateCode.toLowerCase()}@filtec-dealers.in`,
            city: city?.trim() || 'Odisha',
            state: state?.trim() || 'Odisha',
            address: address?.trim() || 'Odisha, India',
            pincode: pincode?.trim() || null,
            gstin: gstin?.trim() || null,
            password: hashedPassword,
            mustChangePassword: false, // Set password during registration
            tier: 'Silver',
            creditLimit: 0,
            outstandingBalance: 0,
            totalPurchases: 0,
            availableRewards: 0,
            pendingPlumberRewards: 0,
            plumbersCount: 0
          }
        });
      }

      const authenticatedUser: User = {
        id: `user-${activeDealer.id}`,
        name: activeDealer.name,
        email: activeDealer.email || `${activeDealer.code.toLowerCase()}@filtec-dealers.in`,
        phone: activeDealer.phone,
        role: 'DEALER',
        dealerId: activeDealer.id,
        allowedPages: [
          '/dealer',
          '/dealer/catalogue',
          '/dealer/orders',
          '/dealer/rewards',
          '/dealer/plumbers',
          '/dealer/invoices',
          '/dealer/profile'
        ],
        mustChangePassword: false
      };

      const sessionToken = createSessionToken({
        userId: activeDealer.id,
        dealerId: activeDealer.id,
        role: 'DEALER',
        phone: activeDealer.phone,
        name: activeDealer.name,
        allowedPages: authenticatedUser.allowedPages
      });

      const { password: _dlrPass, ...safeDealer } = activeDealer;

      const response = NextResponse.json({
        success: true,
        message: 'Dealership account successfully created!',
        user: authenticatedUser,
        dealer: safeDealer,
        token: sessionToken
      });

      response.cookies.set('filtec_session', sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_MAX_AGE_SECONDS,
        expires: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid registration request.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during account creation.' },
      { status: 500 }
    );
  }
}
