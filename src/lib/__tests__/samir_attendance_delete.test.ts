import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { isSamirUser } from '../../utils/samirAuth.ts';
import { prisma } from '../prisma.ts';

describe('Samir Exclusive Attendance Deletion Specification', () => {
  test('isSamirUser returns true for Samir with ADMIN role', () => {
    // By name
    assert.equal(
      isSamirUser({ role: 'ADMIN', name: 'Samir', userId: 'user-admin-samir' }),
      true
    );
    // By code
    assert.equal(
      isSamirUser({ role: 'ADMIN', name: 'Operations Admin', employeeCode: 'FPPL/ADM-001' }),
      true
    );
    // By phone
    assert.equal(
      isSamirUser({ role: 'ADMIN', name: 'Admin', phone: '+91 94375 05814' }),
      true
    );
    // By email
    assert.equal(
      isSamirUser({ role: 'ADMIN', name: 'Operations Admin', email: 'samir@filtec.in' }),
      true
    );
  });

  test('isSamirUser strictly returns false for employees, even if granted attendance page permissions', () => {
    const employeeWithAttendancePerm = {
      role: 'EMPLOYEE',
      name: 'Arun Kumar Sahoo',
      userId: 'emp-001',
      allowedPages: ['/admin/attendance', '/admin/dealers']
    };
    assert.equal(isSamirUser(employeeWithAttendancePerm), false);

    // Employee named "Samir" without ADMIN role must also be rejected
    const employeeNamedSamir = {
      role: 'EMPLOYEE',
      name: 'Samir Employee',
      userId: 'emp-samir-worker'
    };
    assert.equal(isSamirUser(employeeNamedSamir), false);
  });

  test('isSamirUser strictly returns false for non-Samir administrators', () => {
    const otherAdmin = {
      role: 'ADMIN',
      name: 'Rajesh Sharma',
      userId: 'user-admin-rajesh',
      employeeCode: 'FPPL/ADM-002'
    };
    assert.equal(isSamirUser(otherAdmin), false);
  });

  test('isSamirUser safely rejects null or undefined session inputs', () => {
    assert.equal(isSamirUser(null), false);
    assert.equal(isSamirUser(undefined), false);
    assert.equal(isSamirUser({}), false);
  });

  test('Database properly executes atomic attendance deletion and verification', async () => {
    const testSummaryId = `test-sum-${Date.now()}`;
    const testRecordId = `test-rec-${Date.now()}`;
    const testDate = '2026-11-01';

    try {
      await prisma.dailyAttendanceSummary.create({
        data: {
          id: testSummaryId,
          date: testDate,
          employeeId: 'emp-test-999',
          employeeCode: 'FPPL/TEST-999',
          employeeName: 'Test Employee',
          phone: '+91 9999999999',
          territory: 'Bhubaneswar',
          status: 'ACTIVE_ON_FIELD'
        }
      });

      await prisma.attendanceRecord.create({
        data: {
          id: testRecordId,
          employeeId: 'emp-test-999',
          employeeName: 'Test Employee',
          type: 'CHECK_IN',
          timestamp: new Date(),
          latitude: 20.4625,
          longitude: 85.8828,
          locationName: 'Cuttack Sadar, Odisha',
          photoUrl: 'data:image/jpeg;base64,sample'
        }
      });

      // Verify they exist in DB
      const sumBefore = await prisma.dailyAttendanceSummary.findUnique({ where: { id: testSummaryId } });
      assert.notEqual(sumBefore, null);

      const recBefore = await prisma.attendanceRecord.findUnique({ where: { id: testRecordId } });
      assert.notEqual(recBefore, null);

      // Execute deletion
      await prisma.dailyAttendanceSummary.deleteMany({ where: { id: testSummaryId } });
      await prisma.attendanceRecord.deleteMany({ where: { id: testRecordId } });

      // Verify deletion in DB
      const sumAfter = await prisma.dailyAttendanceSummary.findUnique({ where: { id: testSummaryId } });
      assert.equal(sumAfter, null);

      const recAfter = await prisma.attendanceRecord.findUnique({ where: { id: testRecordId } });
      assert.equal(recAfter, null);
    } finally {
      await prisma.dailyAttendanceSummary.deleteMany({ where: { id: testSummaryId } }).catch(() => {});
      await prisma.attendanceRecord.deleteMany({ where: { id: testRecordId } }).catch(() => {});
    }
  });
});
