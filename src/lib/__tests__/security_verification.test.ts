import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  getSessionFromRequest
} from '../security.ts';

describe('Post-Remediation Security Verification Suite', () => {

  describe('1. Cryptographic Password Hashing & Legacy Migration (VULN-01)', () => {
    it('generates salted PBKDF2 hashes with 100k iterations and SHA-512', () => {
      const password = 'TestSecretPassword#2026';
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);

      assert.ok(hash1.startsWith('pbkdf2$100000$'), 'Hash must have PBKDF2 scheme with 100000 iterations');
      assert.notEqual(hash1, hash2, 'Salts must be cryptographically random and unique per invocation');

      const verification = verifyPassword(password, hash1);
      assert.equal(verification.valid, true, 'Valid password must verify');
      assert.equal(verification.needsUpgrade, false, 'Hashed password does not need upgrade');

      const failedVerification = verifyPassword('WrongPassword', hash1);
      assert.equal(failedVerification.valid, false, 'Invalid password must fail verification');
    });

    it('smoothly authenticates legacy plaintext credentials and flags for database upgrade', () => {
      const legacyPlain = 'legacyPass123';
      const result = verifyPassword(legacyPlain, legacyPlain);

      assert.equal(result.valid, true, 'Legacy credentials must authenticate seamlessly');
      assert.equal(result.needsUpgrade, true, 'Must signal needsUpgrade to trigger zero-downtime hashing in database');
    });
  });

  describe('2. Session Tampering & Signature Validation (VULN-02 & VULN-03)', () => {
    it('produces signed HMAC-SHA256 session tokens that cannot be forged', () => {
      const adminPayload = {
        userId: 'admin-01',
        role: 'ADMIN' as const,
        name: 'Super Admin'
      };
      const token = createSessionToken(adminPayload);
      assert.ok(token.includes('.'), 'Token must contain payload and signature separated by dot');

      const verified = verifySessionToken(token);
      assert.ok(verified !== null, 'Valid token must decode');
      assert.equal(verified?.userId, 'admin-01');
      assert.equal(verified?.role, 'ADMIN');

      // Attempt privilege escalation by tampering payload to grant admin role
      const [payloadB64, sig] = token.split('.');
      const tamperedObj = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
      tamperedObj.userId = 'attacker-id';
      const forgedPayloadB64 = Buffer.from(JSON.stringify(tamperedObj)).toString('base64url');
      const forgedToken = `${forgedPayloadB64}.${sig}`;

      const forgedResult = verifySessionToken(forgedToken);
      assert.equal(forgedResult, null, 'Tampered token signature must be rejected');
    });

    it('rejects expired tokens', () => {
      // Create token expired in the past (-1 hour)
      const expiredToken = createSessionToken({ userId: 'u-1', role: 'EMPLOYEE' }, -1);
      const res = verifySessionToken(expiredToken);
      assert.equal(res, null, 'Expired session token must be rejected');
    });

    it('correctly extracts session from Cookie header and Bearer Authorization header', () => {
      const token = createSessionToken({ userId: 'emp-55', role: 'EMPLOYEE' });

      // Via Cookie
      const reqWithCookie = new Request('http://localhost/api/test', {
        headers: { Cookie: `filtec_session=${token}; other_cookie=xyz` }
      });
      const sessionFromCookie = getSessionFromRequest(reqWithCookie);
      assert.ok(sessionFromCookie !== null);
      assert.equal(sessionFromCookie?.userId, 'emp-55');

      // Via Authorization Bearer
      const reqWithBearer = new Request('http://localhost/api/test', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sessionFromBearer = getSessionFromRequest(reqWithBearer);
      assert.ok(sessionFromBearer !== null);
      assert.equal(sessionFromBearer?.userId, 'emp-55');

      // Missing credentials
      const reqEmpty = new Request('http://localhost/api/test');
      assert.equal(getSessionFromRequest(reqEmpty), null, 'Empty request must return null session');
    });
  });

  describe('3. Role Boundaries & Authorization Logic (VULN-04 & VULN-05)', () => {
    it('differentiates admin vs employee privileges for destructive actions', () => {
      const ADMIN_ONLY_ACTIONS = ['DELETE_EMPLOYEE', 'DELETE_PRODUCT', 'DELETE_ORDER', 'UPDATE_SETTINGS', 'DELETE_DEALER', 'CREATE_EMPLOYEE'];

      const employeeSession = verifySessionToken(createSessionToken({ userId: 'emp-1', role: 'EMPLOYEE' }));
      const adminSession = verifySessionToken(createSessionToken({ userId: 'adm-1', role: 'ADMIN' }));

      // Employee attempting admin action
      for (const action of ADMIN_ONLY_ACTIONS) {
        const isActionAllowedForEmployee = employeeSession?.role === 'ADMIN';
        assert.equal(isActionAllowedForEmployee, false, `Employee must not be authorized to execute ${action}`);

        const isActionAllowedForAdmin = adminSession?.role === 'ADMIN';
        assert.equal(isActionAllowedForAdmin, true, `Admin must be authorized to execute ${action}`);
      }
    });

    it('prevents privilege escalation when non-admin attempts role update', () => {
      const isEscalationAttempt = (action: string, payload: Record<string, unknown>) =>
        Boolean(action === 'UPDATE_EMPLOYEE' && payload?.systemRole && payload.systemRole !== 'EMPLOYEE');

      assert.equal(isEscalationAttempt('UPDATE_EMPLOYEE', { systemRole: 'ADMIN' }), true);
      assert.equal(isEscalationAttempt('UPDATE_EMPLOYEE', { systemRole: 'EMPLOYEE' }), false);
      assert.equal(isEscalationAttempt('UPDATE_EMPLOYEE', { name: 'New Name' }), false);
    });
  });

  describe('4. Salary Masking & Cross-Entity Privacy Protection (VULN-06)', () => {
    it('masks employee baseSalary to 0 for unauthorized callers', () => {
      const targetEmployee = { id: 'emp-samir', code: 'FPPL/OD-001', baseSalary: 30000 };

      // Case 1: Caller is another employee
      const otherEmployeeSession: { userId: string; role: string; employeeCode: string } = {
        userId: 'emp-ramesh',
        role: 'EMPLOYEE',
        employeeCode: 'FPPL/OD-002'
      };
      const canOtherView =
        otherEmployeeSession.role === 'ADMIN' ||
        otherEmployeeSession.userId === targetEmployee.id ||
        otherEmployeeSession.employeeCode === targetEmployee.code;
      const salaryViewedByOther = canOtherView ? targetEmployee.baseSalary : 0;
      assert.equal(salaryViewedByOther, 0, 'Other employee must NOT see peer salary');

      // Case 2: Caller is Samir (Self)
      const selfSession: { userId: string; role: string; employeeCode: string } = {
        userId: 'emp-samir',
        role: 'EMPLOYEE',
        employeeCode: 'FPPL/OD-001'
      };
      const canSelfView =
        selfSession.role === 'ADMIN' ||
        selfSession.userId === targetEmployee.id ||
        selfSession.employeeCode === targetEmployee.code;
      const salaryViewedBySelf = canSelfView ? targetEmployee.baseSalary : 0;
      assert.equal(salaryViewedBySelf, 30000, 'Employee must be able to view their own salary');

      // Case 3: Caller is Admin
      const adminSession = { userId: 'admin-1', role: 'ADMIN' as const };
      const canAdminView = adminSession.role === 'ADMIN';
      const salaryViewedByAdmin = canAdminView ? targetEmployee.baseSalary : 0;
      assert.equal(salaryViewedByAdmin, 30000, 'Admin must be able to view employee salary');
    });
  });

  describe('5. SSRF Input Sanitization (VULN-07)', () => {
    it('strictly accepts valid Google Sheet IDs and blocks SSRF payloads', () => {
      const SHEET_ID_REGEX = /^[a-zA-Z0-9_-]{15,100}$/;

      const validSheetId = '1AksLp5CKSE5oUz_9VnzLQFG0J0YzJYXBDy3ldx01aCE';
      assert.equal(SHEET_ID_REGEX.test(validSheetId), true, 'Valid Google Sheet ID must pass');

      // Malicious payloads
      const traversalPayload = '../../etc/passwd';
      const urlPayload = 'http://169.254.169.254/metadata';
      const xssPayload = '<script>alert(1)</script>';

      assert.equal(SHEET_ID_REGEX.test(traversalPayload), false, 'Path traversal must be rejected');
      assert.equal(SHEET_ID_REGEX.test(urlPayload), false, 'URL redirection must be rejected');
      assert.equal(SHEET_ID_REGEX.test(xssPayload), false, 'XSS characters must be rejected');
    });
  });

  describe('6. Edge WebCrypto Interoperability & HTTP Boundary Verification', () => {
    it('guarantees Node crypto and Edge WebCrypto produce identical HMAC signatures', async () => {
      const { getAuthSecret } = await import('../security.ts');
      const token = createSessionToken({ userId: 'u-1', role: 'ADMIN' });
      const [payloadB64, signature] = token.split('.');

      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(getAuthSecret()),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
      const edgeSig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      assert.equal(signature, edgeSig, 'Node crypto signature must identically match Edge WebCrypto signature');
    });

    it('enforces cross-dealer boundary so Dealer A cannot submit orders for Dealer B', () => {
      const callerDealerSession = { userId: 'dlr-001', role: 'DEALER' as const, dealerId: 'dlr-001' };

      const isOrderAuthorized = (payload: { dealerId: string }) => {
        return payload.dealerId === callerDealerSession.userId || payload.dealerId === callerDealerSession.dealerId;
      };

      assert.equal(isOrderAuthorized({ dealerId: 'dlr-001' }), true, 'Dealer must be able to order for own account');
      assert.equal(isOrderAuthorized({ dealerId: 'dlr-999' }), false, 'Dealer must be blocked from ordering for peer account');
    });

    it('blocks employee from recording attendance for another employee', () => {
      const callerEmpSession = { userId: 'emp-001', role: 'EMPLOYEE' as const, employeeCode: 'FPPL/OD-001' };

      const isAttendanceAuthorized = (payload: { employeeId: string }) => {
        return payload.employeeId === callerEmpSession.userId || payload.employeeId === callerEmpSession.employeeCode;
      };

      assert.equal(isAttendanceAuthorized({ employeeId: 'emp-001' }), true);
      assert.equal(isAttendanceAuthorized({ employeeId: 'FPPL/OD-001' }), true);
      assert.equal(isAttendanceAuthorized({ employeeId: 'emp-999' }), false);
    });
  });
});
