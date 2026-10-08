import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User, Role } from '@/types';
import { checkRateLimit } from '@/lib/rateLimit';

// Helper to format clean Indian phone numbers
function formatPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return last10.length === 10 ? `+91 ${last10.slice(0, 5)} ${last10.slice(5)}` : phone.trim();
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const body = await req.json();
    const { entityId, type, name, phone, email, avatarUrl, newPassword } = body;

    // Rate limit: 12 requests per minute
    const rl = checkRateLimit(`profile:${ip}:${entityId || 'anon'}`, 12, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many profile update requests. Please wait ${rl.resetInSec} seconds before trying again.`
        },
        { status: 429 }
      );
    }

    if (!entityId) {
      return NextResponse.json(
        { success: false, error: 'Entity ID or user ID is required to update profile.' },
        { status: 400 }
      );
    }

    const trimmedName = name ? name.trim() : undefined;
    const formattedPhone = phone ? formatPhone(phone) : undefined;
    const trimmedEmail = email ? email.trim() : undefined;
    const trimmedPassword = newPassword && newPassword.trim().length >= 5 ? newPassword.trim() : undefined;

    // 1. EMPLOYEE or ADMIN
    if (type === 'EMPLOYEE' || type === 'ADMIN') {
      const cleanEmpId = entityId.replace(/^user-/, '');
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { id: cleanEmpId },
            { id: entityId },
            { code: cleanEmpId },
            { code: entityId }
          ]
        }
      });

      if (!employee) {
        return NextResponse.json(
          { success: false, error: 'Employee account was not found.' },
          { status: 404 }
        );
      }

      const empUpdateData: any = {};
      if (trimmedName) empUpdateData.name = trimmedName;
      if (formattedPhone) empUpdateData.phone = formattedPhone;
      if (trimmedEmail !== undefined) empUpdateData.email = trimmedEmail;
      if (trimmedPassword) {
        empUpdateData.password = trimmedPassword;
        empUpdateData.mustChangePassword = false;
      }

      const updatedEmp = await prisma.employee.update({
        where: { id: employee.id },
        data: empUpdateData
      });

      // Update or Upsert into User table
      try {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: `user-${employee.id}` },
              { id: employee.id },
              { employeeCode: employee.code },
              { phone: employee.phone }
            ]
          }
        });

        const userUpdateData: any = {};
        if (trimmedName) userUpdateData.name = trimmedName;
        if (formattedPhone) userUpdateData.phone = formattedPhone;
        if (trimmedEmail !== undefined) userUpdateData.email = trimmedEmail;
        if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl;
        if (trimmedPassword) {
          userUpdateData.password = trimmedPassword;
          userUpdateData.mustChangePassword = false;
        }

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: userUpdateData
          });
        } else {
          await prisma.user.create({
            data: {
              id: `user-${employee.id}`,
              name: trimmedName || employee.name,
              email: trimmedEmail || employee.email || `${employee.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@filtec.in`,
              phone: formattedPhone || employee.phone,
              role: (employee.systemRole as Role) || 'EMPLOYEE',
              avatarUrl: avatarUrl || null,
              employeeCode: employee.code,
              allowedPages: employee.allowedPages || '[]',
              password: trimmedPassword || employee.password || null,
              mustChangePassword: false
            }
          });
        }
      } catch (err) {
        console.warn('Prisma user sync warning (non-fatal):', err);
      }

      const role: Role = (updatedEmp.systemRole as Role) || 'EMPLOYEE';
      let allowedPages: string[] = [];
      try {
        allowedPages = updatedEmp.allowedPages ? JSON.parse(updatedEmp.allowedPages) : [];
      } catch {
        allowedPages = [];
      }

      const finalUser: User = {
        id: `user-${updatedEmp.id}`,
        name: updatedEmp.name,
        email: updatedEmp.email || `${updatedEmp.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@filtec.in`,
        phone: updatedEmp.phone,
        role,
        avatarUrl: avatarUrl || undefined,
        employeeCode: updatedEmp.code,
        allowedPages,
        mustChangePassword: false
      };

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully.',
        user: finalUser
      });
    }

    // 2. DEALER
    if (type === 'DEALER') {
      const cleanDealerId = entityId.replace(/^user-/, '');
      const dealer = await prisma.dealer.findFirst({
        where: {
          OR: [
            { id: cleanDealerId },
            { id: entityId },
            { code: cleanDealerId },
            { code: entityId }
          ]
        }
      });

      if (!dealer) {
        return NextResponse.json(
          { success: false, error: 'Dealer account was not found.' },
          { status: 404 }
        );
      }

      const dealerUpdateData: any = {};
      if (trimmedName) {
        dealerUpdateData.name = trimmedName;
        dealerUpdateData.ownerName = trimmedName;
      }
      if (formattedPhone) dealerUpdateData.phone = formattedPhone;
      if (trimmedEmail !== undefined) dealerUpdateData.email = trimmedEmail;
      if (trimmedPassword) {
        dealerUpdateData.password = trimmedPassword;
        dealerUpdateData.mustChangePassword = false;
      }

      const updatedDealer = await prisma.dealer.update({
        where: { id: dealer.id },
        data: dealerUpdateData
      });

      // Update or Upsert in User table
      try {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: `user-${dealer.id}` },
              { id: dealer.id },
              { dealerId: dealer.id },
              { phone: dealer.phone }
            ]
          }
        });

        const userUpdateData: any = {};
        if (trimmedName) userUpdateData.name = trimmedName;
        if (formattedPhone) userUpdateData.phone = formattedPhone;
        if (trimmedEmail !== undefined) userUpdateData.email = trimmedEmail;
        if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl;
        if (trimmedPassword) {
          userUpdateData.password = trimmedPassword;
          userUpdateData.mustChangePassword = false;
        }

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: userUpdateData
          });
        } else {
          await prisma.user.create({
            data: {
              id: `user-${dealer.id}`,
              name: trimmedName || dealer.name,
              email: trimmedEmail || dealer.email || `${dealer.code.toLowerCase()}@filtec-dealers.in`,
              phone: formattedPhone || dealer.phone,
              role: 'DEALER',
              avatarUrl: avatarUrl || null,
              dealerId: dealer.id,
              allowedPages: JSON.stringify([
                '/dealer',
                '/dealer/catalogue',
                '/dealer/orders',
                '/dealer/rewards',
                '/dealer/plumbers',
                '/dealer/invoices',
                '/dealer/profile'
              ]),
              password: trimmedPassword || dealer.password || null,
              mustChangePassword: false
            }
          });
        }
      } catch (err) {
        console.warn('Prisma dealer user sync warning (non-fatal):', err);
      }

      const finalUser: User = {
        id: `user-${updatedDealer.id}`,
        name: updatedDealer.name,
        email: updatedDealer.email || `${updatedDealer.code.toLowerCase()}@filtec-dealers.in`,
        phone: updatedDealer.phone,
        role: 'DEALER',
        avatarUrl: avatarUrl || undefined,
        dealerId: updatedDealer.id,
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

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully.',
        user: finalUser
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid account type specified.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while updating profile.' },
      { status: 500 }
    );
  }
}
