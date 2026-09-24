import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User, Role } from '@/types';

// Helper to extract clean digits
function extractDigits(str: string): string {
  return (str || '').replace(/\D/g, '');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, phone, password, employeeId, dealerId } = body;

    // 1. DEALER LOGIN (1-Click Identity Selection by dealerId OR Phone + Password)
    if (type === 'DEALER') {
      let matchedDealer = null;

      if (dealerId) {
        matchedDealer = await prisma.dealer.findUnique({
          where: { id: dealerId }
        });
        if (!matchedDealer) {
          return NextResponse.json(
            { success: false, error: 'Selected dealer was not found in the database.' },
            { status: 404 }
          );
        }
      } else {
        if (!phone) {
          return NextResponse.json(
            { success: false, error: 'Phone number is required' },
            { status: 400 }
          );
        }

        const inputDigits = extractDigits(phone);
        if (inputDigits.length < 5) {
          return NextResponse.json(
            { success: false, error: 'Please enter a valid phone number' },
            { status: 400 }
          );
        }

        // Query all dealers from PostgreSQL
        const dealers = await prisma.dealer.findMany();
        matchedDealer = dealers.find((d) => {
          const dealerDigits = extractDigits(d.phone);
          return (
            dealerDigits === inputDigits ||
            dealerDigits.endsWith(inputDigits) ||
            inputDigits.endsWith(dealerDigits)
          );
        });

        if (!matchedDealer) {
          return NextResponse.json(
            {
              success: false,
              error: 'No registered dealer found with this phone number. Please check the number.'
            },
            { status: 404 }
          );
        }

        // Validate password: Must be the last 5 digits of the dealer's phone number
        const dealerDigits = extractDigits(matchedDealer.phone);
        const expectedLast5 = dealerDigits.slice(-5);

        if (password && password.trim() !== expectedLast5) {
          return NextResponse.json(
            {
              success: false,
              error: 'Incorrect password. Default password is the last 5 digits of your phone number.'
            },
            { status: 401 }
          );
        }
      }

      // Construct authenticated dealer User session
      const authenticatedUser: User = {
        id: `user-${matchedDealer.id}`,
        name: matchedDealer.name,
        email: `${matchedDealer.code.toLowerCase()}@filtec-dealers.in`,
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
        ]
      };

      return NextResponse.json({
        success: true,
        user: authenticatedUser,
        dealer: matchedDealer
      });
    }

    // 2. EMPLOYEE LOGIN (Direct Identity Selection by employeeId)
    if (type === 'EMPLOYEE') {
      if (!employeeId) {
        return NextResponse.json(
          { success: false, error: 'Employee ID is required' },
          { status: 400 }
        );
      }

      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });

      if (!employee) {
        return NextResponse.json(
          { success: false, error: 'Employee not found in database' },
          { status: 404 }
        );
      }

      const role: Role = (employee.systemRole as Role) || 'EMPLOYEE';
      const allowedPages = employee.allowedPages
        ? JSON.parse(employee.allowedPages)
        : role === 'ADMIN'
        ? [
            '/admin',
            '/admin/orders',
            '/admin/attendance',
            '/admin/catalogue',
            '/admin/dealers',
            '/admin/employees',
            '/admin/rewards',
            '/admin/settings'
          ]
        : [
            '/employee',
            '/employee/dealers',
            '/employee/catalogue',
            '/employee/orders',
            '/employee/attendance'
          ];

      const authenticatedUser: User = {
        id: `user-${employee.id}`,
        name: employee.name,
        email: employee.email || `${employee.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@filtec.in`,
        phone: employee.phone,
        role,
        allowedPages
      };

      return NextResponse.json({
        success: true,
        user: authenticatedUser,
        employee
      });
    }

    // 3. ADMIN LOGIN
    if (type === 'ADMIN') {
      const adminEmployee = await prisma.employee.findFirst({
        where: { systemRole: 'ADMIN' }
      });

      const authenticatedUser: User = {
        id: adminEmployee ? `user-${adminEmployee.id}` : 'user-admin-samir',
        name: adminEmployee?.name || 'Samir',
        email: adminEmployee?.email || 'samir@filtec.in',
        phone: adminEmployee?.phone || '+91 9437505814',
        role: 'ADMIN',
        allowedPages: [
          '/admin',
          '/admin/orders',
          '/admin/attendance',
          '/admin/catalogue',
          '/admin/dealers',
          '/admin/employees',
          '/admin/rewards',
          '/admin/settings'
        ]
      };

      return NextResponse.json({
        success: true,
        user: authenticatedUser
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid login type specified' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
