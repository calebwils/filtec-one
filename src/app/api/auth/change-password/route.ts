import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User, Role } from '@/types';
import { checkRateLimit } from '@/lib/rateLimit';
import { hashPassword, verifyPassword, getSessionFromRequest, createSessionToken } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const body = await req.json();
    const { entityId, type, newPassword, currentPassword } = body;

    // Rate limit: 8 attempts per minute
    const rl = checkRateLimit(`pwd:${ip}:${entityId || 'anon'}`, 8, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password update requests. Please wait ${rl.resetInSec} seconds before trying again.`
        },
        { status: 429 }
      );
    }

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
    const hashedPassword = hashPassword(trimmedPassword);
    const session = getSessionFromRequest(req);

    // 1. Employee / Admin
    if (type === 'EMPLOYEE' || type === 'ADMIN') {
      const cleanEmpId = entityId.replace(/^user-/, '');
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { id: entityId },
            { id: cleanEmpId },
            { code: entityId },
            { code: cleanEmpId }
          ]
        }
      });

      if (!employee) {
        return NextResponse.json(
          { success: false, error: 'Employee account was not found.' },
          { status: 404 }
        );
      }

      // Authorization guard:
      // Must have valid active session matching this employee OR admin role OR valid current password supplied
      const isSelfSession = session && (
        session.userId === employee.id ||
        session.userId === `user-${employee.id}` ||
        session.employeeCode === employee.code
      );
      const isAdminSession = session && session.role === 'ADMIN';

      if (!isAdminSession && !isSelfSession) {
        if (!currentPassword) {
          return NextResponse.json(
            { success: false, error: 'Authorization required: Current password or active session is necessary to change password.' },
            { status: 401 }
          );
        }
        const verifyRes = verifyPassword(currentPassword, employee.password);
        if (!verifyRes.valid) {
          return NextResponse.json(
            { success: false, error: 'Current password provided is incorrect.' },
            { status: 403 }
          );
        }
      }

      const updated = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          password: hashedPassword,
          mustChangePassword: false
        }
      });

      // Update User table if present
      try {
        await prisma.user.updateMany({
          where: {
            OR: [
              { id: `user-${employee.id}` },
              { id: employee.id },
              { employeeCode: employee.code },
              { phone: employee.phone }
            ]
          },
          data: {
            password: hashedPassword,
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

      // Generate refreshed signed session token
      const newSessionToken = createSessionToken({
        userId: updated.id,
        role,
        employeeCode: updated.code,
        phone: updated.phone,
        name: updated.name
      });

      const response = NextResponse.json({
        success: true,
        message: 'Password successfully changed and secured.',
        user: updatedUser,
        token: newSessionToken
      });

      response.cookies.set('filtec_session', newSessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 72 * 3600
      });

      return response;
    }

    // 2. Dealer
    if (type === 'DEALER') {
      const cleanDealerId = entityId.replace(/^user-/, '');
      const dealer = await prisma.dealer.findFirst({
        where: {
          OR: [
            { id: entityId },
            { id: cleanDealerId },
            { code: entityId },
            { code: cleanDealerId }
          ]
        }
      });

      if (!dealer) {
        return NextResponse.json(
          { success: false, error: 'Dealer account was not found.' },
          { status: 404 }
        );
      }

      const isSelfSession = session && (
        session.userId === dealer.id ||
        session.userId === `user-${dealer.id}` ||
        session.phone === dealer.phone
      );
      const isAdminSession = session && session.role === 'ADMIN';

      if (!isAdminSession && !isSelfSession) {
        if (!currentPassword) {
          return NextResponse.json(
            { success: false, error: 'Authorization required: Current password or active session is necessary to change password.' },
            { status: 401 }
          );
        }
        const verifyRes = verifyPassword(currentPassword, dealer.password);
        if (!verifyRes.valid) {
          return NextResponse.json(
            { success: false, error: 'Current password provided is incorrect.' },
            { status: 403 }
          );
        }
      }

      const updated = await prisma.dealer.update({
        where: { id: dealer.id },
        data: {
          password: hashedPassword,
          mustChangePassword: false
        }
      });

      try {
        await prisma.user.updateMany({
          where: {
            OR: [
              { id: `user-${dealer.id}` },
              { id: dealer.id },
              { dealerId: dealer.id },
              { phone: dealer.phone }
            ]
          },
          data: {
            password: hashedPassword,
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
          '/dealer/invoices',
          '/dealer/profile'
        ],
        mustChangePassword: false
      };

      const newSessionToken = createSessionToken({
        userId: updated.id,
        role: 'DEALER',
        phone: updated.phone,
        name: updated.name
      });

      const response = NextResponse.json({
        success: true,
        message: 'Password successfully changed and secured.',
        user: updatedUser,
        token: newSessionToken
      });

      response.cookies.set('filtec_session', newSessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 72 * 3600
      });

      return response;
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
