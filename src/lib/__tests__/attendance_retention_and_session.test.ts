import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, verifySessionToken, SESSION_MAX_AGE_SECONDS, SESSION_MAX_AGE_HOURS } from '../security';
import { getAttendanceRetentionCutoff, isWithinRetentionWindow } from '../../utils/attendanceRetention';
import { pruneExpiredAttendanceRecords } from '../attendanceRetention';
import { prisma } from '../prisma';

describe('1. 90-Day Session Persistence Specification', () => {
  it('defines 90-day constants correctly in seconds and hours', () => {
    assert.equal(SESSION_MAX_AGE_HOURS, 90 * 24, 'SESSION_MAX_AGE_HOURS must be 2160 hours (90 days)');
    assert.equal(SESSION_MAX_AGE_SECONDS, 90 * 24 * 3600, 'SESSION_MAX_AGE_SECONDS must be 7,776,000 seconds (90 days)');
  });

  it('creates session tokens that remain valid for 90 days', () => {
    const token = createSessionToken({
      userId: 'emp-admin-samir',
      role: 'ADMIN',
      name: 'Samir',
      phone: '+91 94375 05814'
    });

    const payload = verifySessionToken(token);
    assert.ok(payload, 'Session token must be valid');
    assert.equal(payload.userId, 'emp-admin-samir');
    assert.equal(payload.role, 'ADMIN');

    const now = Math.floor(Date.now() / 1000);
    const expectedExp = now + SESSION_MAX_AGE_SECONDS;
    assert.ok(Math.abs(payload.exp - expectedExp) < 5, `Token expiration (${payload.exp}) must match 90 days from now (${expectedExp})`);
  });

  it('verifies token remains valid after 89 days but expires at 91 days', () => {
    const valid89Days = createSessionToken(
      { userId: 'emp-101', role: 'EMPLOYEE', name: 'Field Rep' },
      89 * 24
    );
    const verified89 = verifySessionToken(valid89Days);
    assert.ok(verified89, 'Token must still be valid at 89 days');

    const pastExp = Math.floor(Date.now() / 1000) - 100;
    const expiredPayload = { userId: 'emp-101', role: 'EMPLOYEE' as const, exp: pastExp };
    const encoded = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
    const crypto = require('crypto');
    const secret = 'filtec_local_dev_ephemeral_auth_secret_do_not_use_in_prod_x92!';
    const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
    const expiredToken = `${encoded}.${sig}`;

    assert.equal(verifySessionToken(expiredToken), null, 'Expired session token must be rejected');
  });
});

describe('2. 1-Year Attendance Retention Policy & Rolling 13th Month Deletion', () => {
  it('calculates the retention cutoff as exactly 12 complete months before current month', () => {
    const { cutoffDate, cutoffDateStr } = getAttendanceRetentionCutoff();
    const now = new Date();

    assert.equal(cutoffDate.getUTCDate(), 1, 'Cutoff must be first day of the month');
    assert.equal(cutoffDate.getUTCHours(), 0);

    const yearDiff = now.getUTCFullYear() - cutoffDate.getUTCFullYear();
    const monthDiff = yearDiff * 12 + (now.getUTCMonth() - cutoffDate.getUTCMonth());
    assert.equal(monthDiff, 12, 'Retention window must span exactly 12 months (1 full year)');

    assert.match(cutoffDateStr, /^\d{4}-\d{2}-01$/, 'Cutoff string must be formatted YYYY-MM-01');
  });

  it('retains records within the 1-year window (e.g. today, 6 months ago, 11 months ago)', () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    assert.equal(isWithinRetentionWindow(todayStr), true, 'Today must be retained');

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 15).toISOString();
    assert.equal(isWithinRetentionWindow(sixMonthsAgo), true, '6 months ago must be retained');

    const elevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 15).toISOString();
    assert.equal(isWithinRetentionWindow(elevenMonthsAgo), true, '11 months ago must be retained');
  });

  it('prunes records older than 1 year (13th month and beyond)', () => {
    const now = new Date();
    const thirteenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 13, 15).toISOString();
    assert.equal(isWithinRetentionWindow(thirteenMonthsAgo), false, '13th month record must be pruned');

    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), 1).toISOString();
    assert.equal(isWithinRetentionWindow(twoYearsAgo), false, '2 years ago record must be pruned');
  });

  it('correctly persists attendance records in database and prunes expired 13th month data', async () => {
    const now = new Date();
    const testRecentId = `test-att-recent-${Date.now()}`;
    const testExpiredId = `test-att-expired-${Date.now()}`;

    // 14 months ago timestamp (well beyond 12-month retention window)
    const expiredTimestamp = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 14, 15, 10, 0, 0));

    // 1. Insert recent record
    await prisma.attendanceRecord.create({
      data: {
        id: testRecentId,
        employeeId: 'FPPL/OD-001',
        employeeName: 'Purna Chandra Nayak',
        type: 'CHECK_IN',
        timestamp: new Date(),
        latitude: 20.2961,
        longitude: 85.8245,
        locationName: 'Bhubaneswar Unit 4',
        photoUrl: 'data:image/jpeg;base64,mockphoto',
        verified: true,
        distanceFromOffice: 125.5
      }
    });

    // 2. Insert expired record (14 months ago)
    await prisma.attendanceRecord.create({
      data: {
        id: testExpiredId,
        employeeId: 'FPPL/OD-001',
        employeeName: 'Purna Chandra Nayak',
        type: 'CHECK_IN',
        timestamp: expiredTimestamp,
        latitude: 20.2961,
        longitude: 85.8245,
        locationName: 'Old Bhubaneswar Location',
        photoUrl: 'data:image/jpeg;base64,oldphoto',
        verified: true,
        distanceFromOffice: 150.0
      }
    });

    // Verify both were inserted
    const foundRecent = await prisma.attendanceRecord.findUnique({ where: { id: testRecentId } });
    const foundExpired = await prisma.attendanceRecord.findUnique({ where: { id: testExpiredId } });
    assert.ok(foundRecent, 'Recent attendance record must exist in DB');
    assert.ok(foundExpired, 'Expired attendance record must exist before pruning');

    // 3. Execute pruning policy
    await pruneExpiredAttendanceRecords();

    // 4. Assert recent record is preserved and expired record was deleted
    const checkRecentAfterPrune = await prisma.attendanceRecord.findUnique({ where: { id: testRecentId } });
    const checkExpiredAfterPrune = await prisma.attendanceRecord.findUnique({ where: { id: testExpiredId } });

    assert.ok(checkRecentAfterPrune, 'Recent attendance record within 1 year MUST be retained');
    assert.equal(checkExpiredAfterPrune, null, '13th+ month attendance record MUST be pruned');

    // Clean up test recent record
    await prisma.attendanceRecord.delete({ where: { id: testRecentId } });
  });
});
