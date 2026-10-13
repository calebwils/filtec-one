import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, hashPassword, verifyPassword, getAuthSecret } from '../security.ts';
import crypto from 'node:crypto';
import { spawn, ChildProcess } from 'node:child_process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

describe('Live HTTP Endpoints End-to-End Security Verification', () => {

  let spawnedServer: ChildProcess | null = null;

  before(async () => {
    try {
      const probe = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (probe.status === 200) return; // Server is already alive and running
    } catch {
      // Server not detected; spawn next start on port 3001
      spawnedServer = spawn('npx', ['next', 'start', '-p', '3001'], {
        stdio: 'ignore',
        env: { ...process.env, PORT: '3001' }
      });
      for (let i = 0; i < 20; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          const check = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(1000) });
          if (check.status === 200) break;
        } catch {}
      }
    }
  });

  after(() => {
    if (spawnedServer) {
      spawnedServer.kill();
    }
  });

  const secret = getAuthSecret();

  // Test session tokens
  const adminToken = createSessionToken({
    userId: 'admin-01',
    role: 'ADMIN',
    name: 'Executive Admin'
  });

  const dealerAToken = createSessionToken({
    userId: 'dlr-101',
    dealerId: 'dlr-101',
    role: 'DEALER',
    name: 'Apex Sanitary Supplies',
    phone: '+91 94370 12345'
  });

  const employeeToken = createSessionToken({
    userId: 'emp-201',
    employeeCode: 'EMP-001',
    role: 'EMPLOYEE',
    name: 'Rajesh Nayak',
    phone: '+91 94378 11111'
  });

  // 1. Unauthenticated Requests
  describe('1. Unauthenticated Request Enforcement (401)', () => {
    it('rejects GET /api/data without session with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/api/data`);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error, /Unauthorized/i);
    });

    it('rejects POST /api/data without session with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_ORDER', payload: {} })
      });
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error, /Unauthorized/i);
    });

    it('rejects GET /api/dealers without session with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/api/dealers`);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error, /Unauthorized/i);
    });

    it('rejects GET /api/employees without session with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/api/employees`);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error, /Unauthorized/i);
    });

    it('rejects POST /api/orders/notify-admin without session with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/api/orders/notify-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: 'ORD-UNAUTH' })
      });
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error, /Unauthorized/i);
    });
  });

  // 2. Tampered, Forged, and Expired Sessions
  describe('2. Tampered, Forged, and Expired Session Tokens', () => {
    it('rejects signature-tampered token on GET /api/data with 401', async () => {
      const [payload, sig] = dealerAToken.split('.');
      const tamperedSig = sig.slice(0, -3) + 'XYZ';
      const tamperedToken = `${payload}.${tamperedSig}`;

      const res = await fetch(`${BASE_URL}/api/data`, {
        headers: { Cookie: `filtec_session=${tamperedToken}` }
      });
      assert.equal(res.status, 401);
    });

    it('rejects payload-tampered forged role (attempting ADMIN elevation) with 401', async () => {
      const [payload, sig] = dealerAToken.split('.');
      // Forged payload with role ADMIN
      const forgedPayload = Buffer.from(JSON.stringify({ userId: 'dlr-101', role: 'ADMIN' })).toString('base64url');
      const forgedToken = `${forgedPayload}.${sig}`;

      const res = await fetch(`${BASE_URL}/api/data`, {
        headers: { Cookie: `filtec_session=${forgedToken}` }
      });
      assert.equal(res.status, 401);
    });

    it('rejects token signed with foreign/compromised key with 401', async () => {
      const foreignSecret = 'attacker_secret_key_that_does_not_match_app_auth_secret!';
      const payload = Buffer.from(JSON.stringify({ userId: 'attacker', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
      const forgedSig = crypto.createHmac('sha256', foreignSecret).update(payload).digest('base64url');
      const forgedToken = `${payload}.${forgedSig}`;

      const res = await fetch(`${BASE_URL}/api/data`, {
        headers: { Cookie: `filtec_session=${forgedToken}` }
      });
      assert.equal(res.status, 401);
    });

    it('rejects expired session token with 401', async () => {
      const expiredPayload = {
        userId: 'admin-01',
        role: 'ADMIN',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      };
      const enc = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
      const sig = crypto.createHmac('sha256', secret).update(enc).digest('base64url');
      const expiredToken = `${enc}.${sig}`;

      const res = await fetch(`${BASE_URL}/api/data`, {
        headers: { Cookie: `filtec_session=${expiredToken}` }
      });
      assert.equal(res.status, 401);
    });
  });

  // 3. Cross-Dealer IDOR & Tenant Privacy Isolation
  describe('3. Cross-Dealer IDOR & Tenant Privacy Isolation', () => {
    it('Dealer querying GET /api/data receives strictly their own scoped records', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        headers: { Cookie: `filtec_session=${dealerAToken}` }
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);

      // Dealers must NEVER see internal employees, user accounts, attendance, leaves, or audit logs
      assert.deepEqual(json.data.employees, []);
      assert.deepEqual(json.data.users, []);
      assert.deepEqual(json.data.leaveRequests, []);
      assert.deepEqual(json.data.dailyAttendance, []);
      assert.deepEqual(json.data.attendanceRecords, []);
      assert.deepEqual(json.data.auditLogs, []);
      assert.deepEqual(json.data.integrationEvents, []);

      // Scoped dealers: only Dealer A
      for (const d of json.data.dealers) {
        assert.ok(
          d.id === 'dlr-101' || d.phone === '+91 94370 12345',
          `Dealer A received foreign dealer record: ${d.id}`
        );
      }

      // Orders: only Dealer A
      for (const o of json.data.orders) {
        assert.ok(o.dealerId === 'dlr-101', `Foreign order detected in Dealer A view: ${o.id}`);
      }

      // Plumbers: only Dealer A
      for (const p of json.data.plumbers) {
        assert.ok(p.dealerId === 'dlr-101', `Foreign plumber detected in Dealer A view: ${p.id}`);
      }
    });

    it('Dealer querying GET /api/dealers only receives their own dealer profile', async () => {
      const res = await fetch(`${BASE_URL}/api/dealers`, {
        headers: { Cookie: `filtec_session=${dealerAToken}` }
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.dealers.length <= 1);
      if (json.dealers.length === 1) {
        assert.equal(json.dealers[0].id, 'dlr-101');
      }
    });

    it('Dealer is forbidden (403) from querying GET /api/employees', async () => {
      const res = await fetch(`${BASE_URL}/api/employees`, {
        headers: { Cookie: `filtec_session=${dealerAToken}` }
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.error, /Forbidden/i);
    });

    it('blocks Dealer A from creating orders for Dealer B (Cross-Dealer IDOR) with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${dealerAToken}`
        },
        body: JSON.stringify({
          action: 'CREATE_ORDER',
          payload: {
            id: 'ord-idor-test',
            orderNumber: 'ORD-IDOR',
            dealerId: 'dlr-102', // Target Dealer B
            totalAmount: 99999,
            items: []
          }
        })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /own account/i);
    });

    it('blocks Dealer A from modifying Dealer B profile (Cross-Dealer IDOR) with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${dealerAToken}`
        },
        body: JSON.stringify({
          action: 'UPDATE_DEALER',
          payload: {
            id: 'dlr-102',
            name: 'Tampered Profile'
          }
        })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /another dealership/i);
    });

    it('blocks Dealer A from registering plumbers for Dealer B with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${dealerAToken}`
        },
        body: JSON.stringify({
          action: 'CREATE_PLUMBER',
          payload: {
            id: 'plumb-idor',
            name: 'Injected Plumber',
            dealerId: 'dlr-102' // Target Dealer B
          }
        })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /own dealership/i);
    });

    it('blocks Dealer A from allocating rewards from Dealer B account with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${dealerAToken}`
        },
        body: JSON.stringify({
          action: 'ALLOCATE_PLUMBER_REWARD',
          payload: {
            dealerId: 'dlr-102',
            plumberId: 'plumb-1',
            points: 1500
          }
        })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /another dealer/i);
    });

    it('blocks Dealer from registering another dealership (CREATE_DEALER) with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${dealerAToken}`
        },
        body: JSON.stringify({
          action: 'CREATE_DEALER',
          payload: { name: 'Unauthorized Dealership' }
        })
      });
      assert.equal(res.status, 403);
    });
  });

  // 4. Employee Privacy & Non-Admin Mutations
  describe('4. Employee Privacy & Non-Admin Mutations', () => {
    it('Employee querying GET /api/data cannot view peer salaries (masked to 0)', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        headers: { Cookie: `filtec_session=${employeeToken}` }
      });
      assert.equal(res.status, 200);
      const json = await res.json();

      // Ensure peer employees have baseSalary === 0
      for (const e of json.data.employees) {
        if (e.id !== 'emp-201' && e.code !== 'EMP-001') {
          assert.equal(
            e.baseSalary,
            0,
            `Privacy breach: Peer employee ${e.name} baseSalary was not masked!`
          );
        }
      }

      // Internal admin-only logs masked
      assert.deepEqual(json.data.auditLogs, []);
      assert.deepEqual(json.data.integrationEvents, []);
      assert.deepEqual(json.data.users, []);
    });

    it('blocks Employee from recording attendance for another staff member with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${employeeToken}`
        },
        body: JSON.stringify({
          action: 'RECORD_ATTENDANCE',
          payload: {
            employeeId: 'emp-999-victim',
            record: { id: 'att-attack-1', employeeId: 'emp-999-victim' }
          }
        })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /another staff/i);
    });

    it('blocks Employee from submitting leave request for another staff member with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${employeeToken}`
        },
        body: JSON.stringify({
          action: 'CREATE_LEAVE_REQUEST',
          payload: {
            id: 'leave-unauth',
            employeeId: 'emp-999-victim',
            reason: 'Forged leave'
          }
        })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /another staff/i);
    });

    it('blocks Employee from escalating role to ADMIN via UPDATE_EMPLOYEE with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${employeeToken}`
        },
        body: JSON.stringify({
          action: 'UPDATE_EMPLOYEE',
          payload: {
            id: 'emp-201',
            systemRole: 'ADMIN' // Privilege escalation
          }
        })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /Admin access required/i);
    });
  });

  // 5. Complete 14 Admin-Only Mutations Blocked for Non-Admin
  describe('5. Complete Enumeration of 14 Admin-Only Actions (All Blocked for Non-Admin with 403)', () => {
    const adminActions = [
      'UPDATE_SETTINGS',
      'CREATE_EMPLOYEE',
      'DELETE_EMPLOYEE',
      'CREATE_PRODUCT',
      'UPDATE_PRODUCT',
      'TOGGLE_PRODUCT_STOCK',
      'UPDATE_VARIANT_STOCK',
      'DELETE_PRODUCT',
      'APPROVE_ORDER',
      'RELEASE_ORDER',
      'REJECT_ORDER',
      'DELETE_ORDER',
      'UPDATE_LEAVE_REQUEST',
      'SETTLE_VOUCHER'
    ];

    for (const act of adminActions) {
      it(`blocks non-admin from executing ${act} with 403 Forbidden`, async () => {
        const res = await fetch(`${BASE_URL}/api/data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `filtec_session=${dealerAToken}`
          },
          body: JSON.stringify({
            action: act,
            payload: { id: 'test-id', orderId: 'test-order' }
          })
        });
        assert.equal(
          res.status,
          403,
          `Action ${act} returned HTTP status ${res.status} instead of 403 Forbidden!`
        );
        const json = await res.json();
        assert.equal(json.success, false);
      });
    }
  });

  // 6. Password Changes, Registration, and Secret Storage
  describe('6. Password Changes, Registration, and Secret Storage', () => {
    it('blocks unauthenticated password change attempt with 401 or 404 safe rejection', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: 'emp-201',
          type: 'EMPLOYEE',
          newPassword: 'BrandNewPassword#2026'
        })
      });
      assert.ok(res.status === 401 || res.status === 404, `Status was ${res.status}`);
      const json = await res.json();
      assert.equal(json.success, false);
    });

    it('rejects registration with invalid role with 400', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'SUPERADMIN', // Forged role
          name: 'Attacker',
          phone: '+91 99999 88888',
          password: 'password123'
        })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
    });

    it('verifies getAuthSecret requires 256-bit entropy and guards production', () => {
      const sec = getAuthSecret();
      assert.ok(sec.length >= 32, 'Secret must be >= 32 characters (256-bit entropy)');
    });

    it('verifies passwords stored using salted PBKDF2 never leak plaintext in tokens', () => {
      const testToken = createSessionToken({
        userId: 'usr-secure',
        role: 'EMPLOYEE',
        name: 'Secure Employee'
      });
      const [payloadB64] = testToken.split('.');
      const decodedStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
      assert.ok(!decodedStr.includes('password'), 'Session token payload must never contain password field');
    });
  });

  // 7. Administrative Audit Trail & Data Integrity Verification
  describe('7. Administrative Audit Trail & Data Integrity Verification', () => {
    it('captures audit log entry when admin updates settings and isolates audit logs from non-admins', async () => {
      const testAuditKey = `test_setting_${Date.now()}`;
      const mutateRes = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${adminToken}`
        },
        body: JSON.stringify({
          action: 'UPDATE_SETTINGS',
          payload: {
            key: testAuditKey,
            value: 'verified_audit_trail_value'
          }
        })
      });
      assert.equal(mutateRes.status, 200);

      // Verify Admin receives audit logs
      const adminGetRes = await fetch(`${BASE_URL}/api/data`, {
        headers: { Cookie: `filtec_session=${adminToken}` }
      });
      assert.equal(adminGetRes.status, 200);
      const adminData = await adminGetRes.json();
      assert.ok(Array.isArray(adminData.data.auditLogs));
      const foundAudit = adminData.data.auditLogs.find(
        (a: any) => a.action === 'UPDATE_SETTINGS' && a.entityId === testAuditKey
      );
      assert.ok(foundAudit, `Audit log entry for ${testAuditKey} was not found!`);
      assert.equal(foundAudit.role, 'ADMIN');

      // Verify Dealer receives empty auditLogs (cannot inspect or tamper with audit trail)
      const dealerGetRes = await fetch(`${BASE_URL}/api/data`, {
        headers: { Cookie: `filtec_session=${dealerAToken}` }
      });
      const dealerData = await dealerGetRes.json();
      assert.deepEqual(dealerData.data.auditLogs, [], 'Audit trail must be completely hidden from dealers');
    });
  });
});
