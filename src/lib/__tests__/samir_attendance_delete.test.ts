import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { isSamirUser } from '../../utils/samirAuth';
import { POST } from '../../app/api/data/route';
import { createSessionToken } from '../../lib/security';
import { prisma } from '../../lib/prisma';

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

  test('POST /api/data rejects DELETE_ATTENDANCE with 403 for non-Samir callers', async () => {
    // 1. Employee session
    const employeeToken = createSessionToken({
      userId: 'emp-001',
      role: 'EMPLOYEE',
      name: 'Arun Kumar Sahoo',
      allowedPages: ['/admin/attendance']
    });

    const empReq = new Request('http://localhost:3000/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `filtec_session=${employeeToken}`
      },
      body: JSON.stringify({
        action: 'DELETE_ATTENDANCE',
        payload: { id: 'test-summary-id' }
      })
    });

    const empRes = await POST(empReq);
    assert.equal(empRes.status, 403);
    const empData = await empRes.json();
    assert.equal(empData.success, false);
    assert.match(empData.error, /only be deleted by Samir/i);

    // 2. Other admin session
    const otherAdminToken = createSessionToken({
      userId: 'user-admin-other',
      role: 'ADMIN',
      name: 'Other Administrator'
    });

    const otherReq = new Request('http://localhost:3000/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `filtec_session=${otherAdminToken}`
      },
      body: JSON.stringify({
        action: 'DELETE_ATTENDANCE',
        payload: { id: 'test-summary-id' }
      })
    });

    const otherRes = await POST(otherReq);
    assert.equal(otherRes.status, 403);
  });

  test('POST /api/data allows Samir to delete attendance record', async () => {
    // First insert a test attendance record and summary
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

      // Samir session
      const samirToken = createSessionToken({
        userId: 'user-admin-samir',
        role: 'ADMIN',
        name: 'Samir',
        employeeCode: 'FPPL/ADM-001'
      });

      const samirReq = new Request('http://localhost:3000/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `filtec_session=${samirToken}`
        },
        body: JSON.stringify({
          action: 'DELETE_ATTENDANCE',
          payload: {
            id: testSummaryId,
            recordId: testRecordId,
            employeeId: 'emp-test-999',
            employeeName: 'Test Employee',
            date: testDate
          }
        })
      });

      const samirRes = await POST(samirReq);
      assert.equal(samirRes.status, 200);
      const samirData = await samirRes.json();
      assert.equal(samirData.success, true);

      // Verify deletion in database
      const foundSummary = await prisma.dailyAttendanceSummary.findUnique({
        where: { id: testSummaryId }
      });
      assert.equal(foundSummary, null);

      const foundRecord = await prisma.attendanceRecord.findUnique({
        where: { id: testRecordId }
      });
      assert.equal(foundRecord, null);
    } finally {
      // Cleanup if any remained
      await prisma.dailyAttendanceSummary.deleteMany({ where: { id: testSummaryId } }).catch(() => {});
      await prisma.attendanceRecord.deleteMany({ where: { id: testRecordId } }).catch(() => {});
    }
  });
});
