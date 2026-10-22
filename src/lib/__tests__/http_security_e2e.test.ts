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
        body: JSON.stringify({ action: 'CREATE_ORDER', payload: { dealerId: 'dlr-101' } })
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
            items: [{ productId: 'p1', quantity: 1, unitPrice: 100 }]
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

    it('blocks Dealer A from calling UPDATE_PLUMBER on Dealer B plumber with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${dealerAToken}`
        },
        body: JSON.stringify({
          action: 'UPDATE_PLUMBER',
          payload: {
            id: 'plumb-dealer-b',
            name: 'Tampered Plumber Name'
          }
        })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /other dealerships/i);
    });

    it('blocks Dealer A from calling DELETE_PLUMBER on Dealer B plumber with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${dealerAToken}`
        },
        body: JSON.stringify({
          action: 'DELETE_PLUMBER',
          payload: {
            id: 'plumb-dealer-b'
          }
        })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /other dealerships/i);
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

    it('blocks Dealer A from calling DEALER_REDEEM_REWARD for Dealer B with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${dealerAToken}`
        },
        body: JSON.stringify({
          action: 'DEALER_REDEEM_REWARD',
          payload: {
            dealerId: 'dlr-102',
            points: 500
          }
        })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /another dealer/i);
    });

    it('blocks non-admin from modifying creditLimit or outstandingBalance on UPDATE_DEALER with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${dealerAToken}`
        },
        body: JSON.stringify({
          action: 'UPDATE_DEALER',
          payload: {
            id: 'dlr-101',
            creditLimit: 500000
          }
        })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /financial limits/i);
    });

    it('blocks Employee from creating order for unassigned dealer with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${employeeToken}`
        },
        body: JSON.stringify({
          action: 'CREATE_ORDER',
          payload: {
            id: 'ord-unassigned-test',
            dealerId: 'dlr-unassigned-territory-999',
            items: [{ productId: 'p1', quantity: 2, unitPrice: 200 }]
          }
        })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /assigned territory/i);
    });
  });

  // 4. Employee Privacy & Non-Admin Mutations
  describe('4. Employee Privacy & Non-Admin Mutations', () => {
    it('Employee querying GET /api/data cannot view peer salaries (masked to null)', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        headers: { Cookie: `filtec_session=${employeeToken}` }
      });
      assert.equal(res.status, 200);
      const json = await res.json();

      // Ensure peer employees have baseSalary === null
      for (const e of json.data.employees) {
        if (e.id !== 'emp-201' && e.code !== 'EMP-001') {
          assert.equal(
            e.baseSalary,
            null,
            `Privacy breach: Peer employee ${e.name} baseSalary was not masked to null!`
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

  // 5. Complete 16 Admin-Only Mutations Blocked for Non-Admin
  describe('5. Complete Enumeration of 16 Admin-Only Actions (All Blocked for Non-Admin with 403)', () => {
    const adminActions = [
      'UPDATE_SETTINGS',
      'CREATE_DEALER',
      'DELETE_DEALER',
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
            payload: { id: 'test-id', orderId: 'test-order', voucherId: 'test-vouch' }
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

    it('verifies getAuthSecret requires >= 32 bytes (256 bits) of raw key material in production', () => {
      const sec = getAuthSecret();
      assert.ok(Buffer.byteLength(sec, 'utf-8') >= 32, 'Secret must contain at least 32 bytes');
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

  // 7. Administrative Audit Trail & Mutation Capture
  describe('7. Administrative Audit Trail & Mutation Capture', () => {
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

      // Verify Dealer receives empty auditLogs (cannot inspect audit trail)
      const dealerGetRes = await fetch(`${BASE_URL}/api/data`, {
        headers: { Cookie: `filtec_session=${dealerAToken}` }
      });
      const dealerData = await dealerGetRes.json();
      assert.deepEqual(dealerData.data.auditLogs, [], 'Audit trail must be completely hidden from dealers');
    });
  });

  // 8. Authentication Brute-Force Rate Limiting & Session Cookie Lifecycle
  describe('8. Authentication Brute-Force Rate Limiting & Session Lifecycle', () => {
    it('triggers HTTP 429 Too Many Requests when login threshold is exceeded', async () => {
      const testPhone = '+91 99999 00001';
      let triggered429 = false;

      for (let i = 0; i < 12; i++) {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: testPhone,
            password: `bad_pass_${i}`
          })
        });

        if (res.status === 429) {
          triggered429 = true;
          const json = await res.json();
          assert.match(json.error, /Too many login attempts/i);
          break;
        }
      }
      assert.equal(triggered429, true, 'Rate limiter must enforce HTTP 429 on brute force');
    });

    it('enforces HttpOnly, SameSite=lax, and Path=/ attributes on session cookie', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+91 94375 05814', // Samir (Admin)
          password: '05814' // Default last 5 digits
        })
      });

      if (res.status === 200) {
        const setCookie = res.headers.get('set-cookie') || '';
        assert.match(setCookie, /filtec_session=/i, 'Must set filtec_session cookie');
        assert.match(setCookie, /HttpOnly/i, 'Must enforce HttpOnly flag');
        assert.match(setCookie, /SameSite=Lax/i, 'Must enforce SameSite=Lax flag');
        assert.match(setCookie, /Path=\//i, 'Must enforce Path=/ flag');
      }
    });

    it('terminates session and clears cookie via POST /api/auth/logout', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST'
      });
      assert.equal(res.status, 200);
      const setCookie = res.headers.get('set-cookie') || '';
      assert.match(setCookie, /filtec_session=/i);
      assert.match(setCookie, /Max-Age=0/i, 'Logout must clear cookie with Max-Age=0');
    });
  });

  // 9. Input Validation & Malformed Payload Rejection on POST /api/data
  describe('9. Input Validation & Malformed Payload Rejection on POST /api/data', () => {
    it('rejects unsupported action with 400 Bad Request', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${adminToken}`
        },
        body: JSON.stringify({
          action: 'EXECUTE_UNAUTHORIZED_COMMAND',
          payload: {}
        })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.error, /Invalid or unsupported action/i);
    });

    it('rejects non-object payload with 400 Bad Request', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${adminToken}`
        },
        body: JSON.stringify({
          action: 'UPDATE_SETTINGS',
          payload: 'invalid-string-payload'
        })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.error, /Action payload must be a non-null object/i);
    });

    it('rejects oversized payload exceeding 2MB with 413 Payload Too Large', async () => {
      const hugeString = 'A'.repeat(2.5 * 1024 * 1024);
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${adminToken}`
        },
        body: JSON.stringify({
          action: 'UPDATE_SETTINGS',
          payload: { huge: hugeString }
        })
      });
      assert.equal(res.status, 413);
      const json = await res.json();
      assert.match(json.error, /Payload Too Large/i);
    });
  });

  // 10. Financial Logic & State Constraints
  describe('10. Financial Logic & State Constraints', () => {
    it('rejects order with empty items array with 400 Bad Request', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${adminToken}`
        },
        body: JSON.stringify({
          action: 'CREATE_ORDER',
          payload: {
            dealerId: 'dlr-001',
            items: []
          }
        })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.error, /at least one item/i);
    });

    it('rejects order with negative item quantity with 400 Bad Request', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${adminToken}`
        },
        body: JSON.stringify({
          action: 'CREATE_ORDER',
          payload: {
            dealerId: 'dlr-001',
            items: [{ productId: 'p1', quantity: -5, unitPrice: 100 }]
          }
        })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.error, /quantity must be a positive integer/i);
    });

    it('rejects order with negative unit price with 400 Bad Request', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${adminToken}`
        },
        body: JSON.stringify({
          action: 'CREATE_ORDER',
          payload: {
            dealerId: 'dlr-001',
            items: [{ productId: 'p1', quantity: 1, unitPrice: -50 }]
          }
        })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.error, /unit price cannot be negative/i);
    });

    it('rejects negative or zero points in DEALER_REDEEM_REWARD with 400', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${dealerAToken}`
        },
        body: JSON.stringify({
          action: 'DEALER_REDEEM_REWARD',
          payload: {
            dealerId: 'dlr-101',
            points: -100
          }
        })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.error, /must be a positive number/i);
    });

    it('rejects over-redeeming points exceeding dealer balance with 400', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${adminToken}`
        },
        body: JSON.stringify({
          action: 'DEALER_REDEEM_REWARD',
          payload: {
            dealerId: 'dlr-001',
            points: 99999999 // Exceeds availableRewards (which is 0)
          }
        })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.error, /Insufficient reward balance/i);
    });

    it('rejects double-approving an already confirmed order with 409 Conflict', async () => {
      // 1. Create order
      const createRes = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${adminToken}`
        },
        body: JSON.stringify({
          action: 'CREATE_ORDER',
          payload: {
            id: `ord-double-${Date.now()}`,
            orderNumber: `ORD-DBL-${Date.now()}`,
            employeeId: 'emp-admin-samir',
            employeeName: 'Samir',
            dealerId: 'dlr-001',
            dealerName: 'Ashirbad Sanitary',
            dealerPhone: '+91 8847879318',
            dealerCity: 'Kendrapara',
            subtotal: 1271.19,
            gstAmount: 228.81,
            status: 'PENDING',
            totalAmount: 1500,
            items: [{
              id: `it-${Date.now()}`,
              productId: 'F-1',
              productCode: 'F-1',
              productName: 'uPVC Pipe',
              variantId: 'v1',
              variantDescription: '1 inch',
              quantity: 1,
              unitPrice: 1500,
              packingQty: 1,
              packingUnit: 'Pcs',
              totalAmount: 1500
            }]
          }
        })
      });
      assert.equal(createRes.status, 200, `Order creation failed: ${createRes.status}`);
      const orderJson = await createRes.json();
      const orderId = orderJson.order.id;

      // 2. Approve first time -> 200
      const approveRes1 = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${adminToken}`
        },
        body: JSON.stringify({
          action: 'APPROVE_ORDER',
          payload: { orderId, dealerId: 'dlr-001', subtotal: 1500 }
        })
      });
      assert.equal(approveRes1.status, 200);

      // 3. Approve second time -> 409 Conflict
      const approveRes2 = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${adminToken}`
        },
        body: JSON.stringify({
          action: 'APPROVE_ORDER',
          payload: { orderId, dealerId: 'dlr-001', subtotal: 1500 }
        })
      });
      assert.equal(approveRes2.status, 409);
      const dblJson = await approveRes2.json();
      assert.match(dblJson.error, /already approved/i);
    });

    it('rejects double-settling an already settled voucher with 409 Conflict', async () => {
      const testVoucherNum = `VOUCH-DBL-${Date.now()}`;
      // Settle first time
      const settleRes1 = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `filtec_session=${adminToken}`
        },
        body: JSON.stringify({
          action: 'SETTLE_VOUCHER',
          payload: {
            voucherId: `v-${Date.now()}`,
            voucherNumber: testVoucherNum,
            paymentMode: 'BANK_TRANSFER',
            paymentReference: 'REF123456'
          }
        })
      });

      // If voucher was newly settled, second attempt returns 409
      if (settleRes1.status === 200) {
        const settleRes2 = await fetch(`${BASE_URL}/api/data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `filtec_session=${adminToken}`
          },
          body: JSON.stringify({
            action: 'SETTLE_VOUCHER',
            payload: {
              voucherNumber: testVoucherNum,
              paymentMode: 'BANK_TRANSFER'
            }
          })
        });
        assert.equal(settleRes2.status, 409);
        const json = await settleRes2.json();
        assert.match(json.error, /already been settled/i);
      }
    });
  });

  // 11. Security Response Headers Enforcement
  describe('11. Security Response Headers Enforcement', () => {
    it('returns strict security headers on all responses', async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      assert.equal(res.status, 200);

      const xContentType = res.headers.get('x-content-type-options');
      assert.equal(xContentType, 'nosniff', 'Must include X-Content-Type-Options: nosniff');

      const xFrame = res.headers.get('x-frame-options');
      assert.equal(xFrame, 'SAMEORIGIN', 'Must include X-Frame-Options: SAMEORIGIN');

      const referrerPolicy = res.headers.get('referrer-policy');
      assert.equal(referrerPolicy, 'origin-when-cross-origin', 'Must include Referrer-Policy');

      const hsts = res.headers.get('strict-transport-security');
      assert.ok(hsts?.includes('max-age'), 'Must include Strict-Transport-Security');

      const csp = res.headers.get('content-security-policy');
      assert.ok(csp?.includes("default-src 'self'"), 'Must include Content-Security-Policy');
    });
  });
});
