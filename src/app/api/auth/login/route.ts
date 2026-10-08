import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User, Role } from '@/types';
import { checkRateLimit } from '@/lib/rateLimit';

// Helper to extract clean digits from phone
function extractDigits(str: string): string {
  return (str || '').replace(/\D/g, '');
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const body = await req.json();
    const { phone, password, type } = body;

    // Rate limiting: 10 attempts per minute per IP / phone
    const rateLimitKey = `login:${ip}:${extractDigits(phone) || 'unknown'}`;
    const rl = checkRateLimit(rateLimitKey, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please wait ${rl.resetInSec} seconds before trying again.`
        },
        { status: 429 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required.' },
        { status: 400 }
      );
    }

    if (!password || !password.trim()) {
      return NextResponse.json(
        { success: false, error: 'Password is required.' },
        { status: 400 }
      );
    }

    const inputDigits = extractDigits(phone);
    if (inputDigits.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number.' },
        { status: 400 }
      );
    }
    const inputLast10 = inputDigits.slice(-10);
    const trimmedPassword = password.trim();

    // 1. Check EMPLOYEE (or ADMIN) if type is EMPLOYEE or ADMIN or not specified
    if (!type || type === 'EMPLOYEE' || type === 'ADMIN') {
      const allEmployees = await prisma.employee.findMany();
      const matchedEmployee = allEmployees.find((e) => {
        const empDigits = extractDigits(e.phone);
        return (
          empDigits === inputDigits ||
          empDigits.slice(-10) === inputLast10 ||
          empDigits.endsWith(inputDigits) ||
          inputDigits.endsWith(empDigits)
        );
      });

      if (matchedEmployee) {
        // Enforce role filter if explicitly requested ADMIN
        if (type === 'ADMIN' && matchedEmployee.systemRole !== 'ADMIN') {
          return NextResponse.json(
            { success: false, error: 'This phone number does not have Admin access.' },
            { status: 403 }
          );
        }

        const phoneDigits = extractDigits(matchedEmployee.phone);
        const defaultLast5 = phoneDigits.slice(-5);

        // Password check: custom password if set, or default last 5 digits of phone
        const hasCustomPassword = Boolean(matchedEmployee.password && matchedEmployee.password.trim());
        const isDefaultPasswordMatch = trimmedPassword === defaultLast5;
        const isCustomPasswordMatch = hasCustomPassword && trimmedPassword === matchedEmployee.password?.trim();

        if (!isCustomPasswordMatch && !isDefaultPasswordMatch) {
          return NextResponse.json(
            {
              success: false,
              error: hasCustomPassword
                ? 'Incorrect password. Please verify and try again.'
                : 'Incorrect password. Default password is the last 5 digits of your phone number.'
            },
            { status: 401 }
          );
        }

        // Determine if first-time password change is required
        // Required if mustChangePassword is true OR if they logged in with default password and haven't set a custom password
        const mustChangePassword = matchedEmployee.mustChangePassword ?? !hasCustomPassword;

        const role: Role = (matchedEmployee.systemRole as Role) || 'EMPLOYEE';
        let allowedPages: string[] = [];
        try {
          allowedPages = matchedEmployee.allowedPages ? JSON.parse(matchedEmployee.allowedPages) : [];
        } catch {
          allowedPages = [];
        }

        if (role === 'ADMIN') {
          allowedPages = [
            '/admin',
            '/dashboard',
            '/admin/orders',
            '/admin/attendance',
            '/admin/catalogue',
            '/admin/dealers',
            '/admin/employees',
            '/admin/rewards',
            '/admin/settings'
          ];
        } else if (allowedPages.length === 0) {
          allowedPages = [
            '/employee',
            '/employee/dealers',
            '/employee/catalogue',
            '/employee/orders',
            '/employee/attendance'
          ];
        }

        const authenticatedUser: User = {
          id: `user-${matchedEmployee.id}`,
          name: matchedEmployee.name,
          email: matchedEmployee.email || `${matchedEmployee.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@filtec.in`,
          phone: matchedEmployee.phone,
          role,
          employeeCode: matchedEmployee.code,
          allowedPages,
          mustChangePassword
        };

        const { password: _empPass, ...safeEmployee } = matchedEmployee;

        return NextResponse.json({
          success: true,
          mustChangePassword,
          role,
          type: role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
          entityId: matchedEmployee.id,
          user: authenticatedUser,
          employee: safeEmployee
        });
      }
    }

    // 2. Check DEALER if type is DEALER or not specified
    if (!type || type === 'DEALER') {
      const allDealers = await prisma.dealer.findMany();
      const matchedDealer = allDealers.find((d) => {
        const dlrDigits = extractDigits(d.phone);
        return (
          dlrDigits === inputDigits ||
          dlrDigits.slice(-10) === inputLast10 ||
          dlrDigits.endsWith(inputDigits) ||
          inputDigits.endsWith(dlrDigits)
        );
      });

      if (matchedDealer) {
        const phoneDigits = extractDigits(matchedDealer.phone);
        const defaultLast5 = phoneDigits.slice(-5);

        const hasCustomPassword = Boolean(matchedDealer.password && matchedDealer.password.trim());
        const isDefaultPasswordMatch = trimmedPassword === defaultLast5;
        const isCustomPasswordMatch = hasCustomPassword && trimmedPassword === matchedDealer.password?.trim();

        if (!isCustomPasswordMatch && !isDefaultPasswordMatch) {
          return NextResponse.json(
            {
              success: false,
              error: hasCustomPassword
                ? 'Incorrect password. Please verify and try again.'
                : 'Incorrect password. Default password is the last 5 digits of your phone number.'
            },
            { status: 401 }
          );
        }

        const mustChangePassword = matchedDealer.mustChangePassword ?? !hasCustomPassword;

        const authenticatedUser: User = {
          id: `user-${matchedDealer.id}`,
          name: matchedDealer.name,
          email: matchedDealer.email || `${matchedDealer.code.toLowerCase()}@filtec-dealers.in`,
          phone: matchedDealer.phone,
          role: 'DEALER',
          dealerId: matchedDealer.id,
          allowedPages: [
            '/dealer',
            '/dealer/catalogue',
            '/dealer/orders',
            '/dealer/rewards',
            '/dealer/plumbers',
            '/dealer/invoices'
          ],
          mustChangePassword
        };

        const { password: _dlrPass, ...safeDealer } = matchedDealer;

        return NextResponse.json({
          success: true,
          mustChangePassword,
          role: 'DEALER',
          type: 'DEALER',
          entityId: matchedDealer.id,
          user: authenticatedUser,
          dealer: safeDealer
        });
      }
    }

    // 3. Not found in either
    return NextResponse.json(
      {
        success: false,
        error: `No registered account found with phone number ${phone}. Please verify your phone number or create an account.`
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
