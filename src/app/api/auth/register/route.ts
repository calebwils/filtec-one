import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User, Role } from '@/types';

function extractDigits(str: string): string {
  return (str || '').replace(/\D/g, '');
}

export async function POST(req: Request) {
  try {
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

    if (!role || (role !== 'DEALER' && role !== 'EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Please specify whether you are registering as a Dealer or Employee.' },
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

    // 1. REGISTER DEALERSHIP
    if (role === 'DEALER') {
      if (!name || !name.trim()) {
        return NextResponse.json(
          { success: false, error: 'Dealership / Firm name is required.' },
          { status: 400 }
        );
      }

      // Check if phone already registered as dealer
      const allDealers = await prisma.dealer.findMany({ select: { id: true, phone: true } });
      const duplicateDealer = allDealers.find((d) => {
        const dDigits = extractDigits(d.phone);
        return dDigits.slice(-10) === inputLast10;
      });

      if (duplicateDealer) {
        return NextResponse.json(
          { success: false, error: 'A dealership with this phone number is already registered. Please sign in.' },
          { status: 409 }
        );
      }

      // Generate unique dealer code
      const count = await prisma.dealer.count();
      let nextCodeNum = count + 1;
      let candidateCode = `DLR-${String(nextCodeNum).padStart(3, '0')}`;
      while (await prisma.dealer.findUnique({ where: { code: candidateCode } })) {
        nextCodeNum++;
        candidateCode = `DLR-${String(nextCodeNum).padStart(3, '0')}`;
      }

      const dealerId = `dlr-${Date.now()}`;
      const newDealer = await prisma.dealer.create({
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
          password: password.trim(),
          mustChangePassword: false, // Set password during registration so no prompt needed
          tier: 'Silver',
          creditLimit: 0,
          outstandingBalance: 0,
          totalPurchases: 0,
          availableRewards: 0,
          pendingPlumberRewards: 0,
          plumbersCount: 0
        }
      });

      const authenticatedUser: User = {
        id: `user-${newDealer.id}`,
        name: newDealer.name,
        email: newDealer.email || `${newDealer.code.toLowerCase()}@filtec-dealers.in`,
        phone: newDealer.phone,
        role: 'DEALER',
        dealerId: newDealer.id,
        allowedPages: [
          '/dealer',
          '/dealer/catalogue',
          '/dealer/orders',
          '/dealer/rewards',
          '/dealer/plumbers',
          '/dealer/invoices'
        ],
        mustChangePassword: false
      };

      return NextResponse.json({
        success: true,
        message: 'Dealership account successfully created!',
        user: authenticatedUser,
        dealer: newDealer
      });
    }

    // 2. REGISTER EMPLOYEE
    if (role === 'EMPLOYEE') {
      if (!name || !name.trim()) {
        return NextResponse.json(
          { success: false, error: 'Staff full name is required.' },
          { status: 400 }
        );
      }

      // Check if phone already registered as employee
      const allEmployees = await prisma.employee.findMany({ select: { id: true, phone: true } });
      const duplicateEmployee = allEmployees.find((e) => {
        const eDigits = extractDigits(e.phone);
        return eDigits.slice(-10) === inputLast10;
      });

      if (duplicateEmployee) {
        return NextResponse.json(
          { success: false, error: 'A staff member with this phone number is already registered. Please sign in.' },
          { status: 409 }
        );
      }

      // Generate unique employee code
      const count = await prisma.employee.count();
      let nextCodeNum = count + 1;
      let candidateCode = `FPPL/OD-${String(nextCodeNum).padStart(3, '0')}`;
      while (await prisma.employee.findUnique({ where: { code: candidateCode } })) {
        nextCodeNum++;
        candidateCode = `FPPL/OD-${String(nextCodeNum).padStart(3, '0')}`;
      }

      const empId = `emp-${Date.now()}`;
      const allowedPages = [
        '/employee',
        '/employee/dealers',
        '/employee/catalogue',
        '/employee/orders',
        '/employee/attendance'
      ];

      const newEmployee = await prisma.employee.create({
        data: {
          id: empId,
          code: candidateCode,
          name: name.trim(),
          phone: formattedPhone,
          email: email?.trim() || `${candidateCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@filtec.in`,
          designation: designation?.trim() || 'Field Representative',
          territory: territory?.trim() || 'Odisha Hub',
          password: password.trim(),
          mustChangePassword: false,
          systemRole: 'EMPLOYEE',
          allowedPages: JSON.stringify(allowedPages),
          targetMonthly: 300000,
          currentMonthSales: 0,
          activeOrdersCount: 0,
          baseSalary: 30000,
          checkInStatus: 'CHECKED_OUT'
        }
      });

      const authenticatedUser: User = {
        id: `user-${newEmployee.id}`,
        name: newEmployee.name,
        email: newEmployee.email || `${newEmployee.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@filtec.in`,
        phone: newEmployee.phone,
        role: 'EMPLOYEE',
        employeeCode: newEmployee.code,
        allowedPages,
        mustChangePassword: false
      };

      return NextResponse.json({
        success: true,
        message: 'Employee account successfully created!',
        user: authenticatedUser,
        employee: newEmployee
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid role specified.' },
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
