import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, verifySessionToken } from '../security.ts';
import { prisma } from '../prisma.ts';

describe('Employee Admin Access & Permission Controls', () => {
  it('creates and verifies session tokens containing employee allowedPages', () => {
    const pages = [
      '/employee',
      '/employee/dealers',
      '/employee/catalogue',
      '/employee/orders',
      '/employee/attendance',
      '/admin/catalogue',
      '/admin/dealers',
      '/admin/rewards'
    ];

    const token = createSessionToken({
      userId: 'emp-2',
      role: 'EMPLOYEE',
      employeeCode: 'FPPL/OD-004',
      name: 'Ramesh sharma',
      phone: '+91 9437860479',
      allowedPages: pages
    });

    const verified = verifySessionToken(token);
    assert.ok(verified, 'Session token should be valid and verified');
    assert.equal(verified?.userId, 'emp-2');
    assert.equal(verified?.role, 'EMPLOYEE');
    assert.deepEqual(verified?.allowedPages, pages);
  });

  it('verifies Ramesh Sharma has active admin permissions in the database', async () => {
    const employee = await prisma.employee.findUnique({
      where: { code: 'FPPL/OD-004' }
    });

    assert.ok(employee, 'Employee FPPL/OD-004 should exist in database');
    assert.equal(employee?.name, 'Ramesh sharma');

    const allowedPages = employee?.allowedPages ? JSON.parse(employee.allowedPages) : [];
    assert.ok(allowedPages.includes('/admin/catalogue'), 'Must have /admin/catalogue permission');
    assert.ok(allowedPages.includes('/admin/dealers'), 'Must have /admin/dealers permission');
    assert.ok(allowedPages.includes('/admin/rewards'), 'Must have /admin/rewards permission');
    assert.ok(allowedPages.includes('/employee'), 'Must retain field /employee permission');

    const adminPagesCount = allowedPages.filter((p: string) => p.startsWith('/admin')).length;
    assert.equal(adminPagesCount, 4, 'Must have exactly 4 admin pages granted');
  });

  it('verifies employee record update successfully persists allowedPages to PostgreSQL', async () => {
    const currentEmp = await prisma.employee.findUnique({
      where: { code: 'FPPL/OD-004' }
    });
    assert.ok(currentEmp);

    const testPages = [
      '/employee',
      '/employee/dealers',
      '/employee/catalogue',
      '/employee/orders',
      '/employee/attendance',
      '/admin/catalogue',
      '/admin/dealers',
      '/admin/rewards',
      '/admin/settings'
    ];

    const updated = await prisma.employee.update({
      where: { code: 'FPPL/OD-004' },
      data: {
        allowedPages: JSON.stringify(testPages)
      }
    });

    assert.equal(updated.allowedPages, JSON.stringify(testPages));
  });
});
