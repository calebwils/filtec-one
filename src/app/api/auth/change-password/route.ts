import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User, Role } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { entityId, type, newPassword } = body;

    if (!entityId) {
      return NextResponse.json(
        { success: false, error: 'Entity ID is required to update password.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 5 characters long.' },
        { status: 400 }
      );
    }

    const trimmedPassword = newPassword.trim();

    // 1. Employee / Admin
    if (type === 'EMPLOYEE' || type === 'ADMIN') {
      const employee = await prisma.employee.findUnique({
        where: { id: entityId }
      });

      if (!employee) {
        return NextResponse.json(
          { success: false, error: 'Employee account was not found.' },
          { status: 404 }
        );
      }

      const updated = await prisma.employee.update({
        where: { id: entityId },
        data: {
          password: trimmedPassword,
          mustChangePassword: false
        }
      });

      // Update User table if present
      try {
        await prisma.user.updateMany({
          where: {
            OR: [
              { id: `user-${employee.id}` },
              { employeeCode: employee.code },
              { phone: employee.phone }
            ]
          },
          data: {
            password: trimmedPassword,
            mustChangePassword: false
          }
        });
      } catch (e) {}

      const role: Role = (updated.systemRole as Role) || 'EMPLOYEE';
      let allowedPages: string[] = [];
      try {
        allowedPages = updated.allowedPages ? JSON.parse(updated.allowedPages) : [];
      } catch {
        allowedPages = [];
      }

      const updatedUser: User = {
        id: `user-${updated.id}`,
        name: updated.name,
        email: updated.email || `${updated.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@filtec.in`,
        phone: updated.phone,
        role,
        employeeCode: updated.code,
        allowedPages,
        mustChangePassword: false
      };

      return NextResponse.json({
        success: true,
        message: 'Password successfully changed and saved.',
        user: updatedUser
      });
    }

    // 2. Dealer
    if (type === 'DEALER') {
      const dealer = await prisma.dealer.findUnique({
        where: { id: entityId }
      });

      if (!dealer) {
        return NextResponse.json(
          { success: false, error: 'Dealer account was not found.' },
          { status: 404 }
        );
      }

      const updated = await prisma.dealer.update({
        where: { id: entityId },
        data: {
          password: trimmedPassword,
          mustChangePassword: false
        }
      });

      try {
        await prisma.user.updateMany({
          where: {
            OR: [
              { id: `user-${dealer.id}` },
              { dealerId: dealer.id },
              { phone: dealer.phone }
            ]
          },
          data: {
            password: trimmedPassword,
            mustChangePassword: false
          }
        });
      } catch (e) {}

      const updatedUser: User = {
        id: `user-${updated.id}`,
        name: updated.name,
        email: updated.email || `${updated.code.toLowerCase()}@filtec-dealers.in`,
        phone: updated.phone,
        role: 'DEALER',
        dealerId: updated.id,
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
        message: 'Password successfully changed and saved.',
        user: updatedUser
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid account type specified.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while updating password.' },
      { status: 500 }
    );
  }
}
