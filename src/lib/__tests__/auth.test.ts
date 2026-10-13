import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken
} from '../security.ts';

describe('Security & Authentication Engine', () => {
  it('correctly hashes passwords with PBKDF2/SHA-512 and verifies matches', () => {
    const rawPassword = 'SecureFiltecPassword#2026';
    const hash = hashPassword(rawPassword);

    assert.ok(hash.startsWith('pbkdf2$'));
    assert.notEqual(hash, rawPassword);

    const checkSuccess = verifyPassword(rawPassword, hash);
    assert.equal(checkSuccess.valid, true);
    assert.equal(checkSuccess.needsUpgrade, false);

    const checkFailure = verifyPassword('WrongPassword', hash);
    assert.equal(checkFailure.valid, false);
  });

  it('supports legacy plaintext password with automatic upgrade signal', () => {
    const plain = 'myOldPassword123';
    const check = verifyPassword(plain, plain);

    assert.equal(check.valid, true);
    assert.equal(check.needsUpgrade, true); // Signals to backend that password should be upgraded
  });

  it('signs and verifies session tokens with tamper-resistance', () => {
    const sessionData = {
      userId: 'emp-101',
      role: 'EMPLOYEE' as const,
      name: 'Purna Chandra Nayak',
      phone: '+91 94378 12345',
      employeeCode: 'FPPL/OD-002'
    };

    const token = createSessionToken(sessionData);
    assert.ok(typeof token === 'string' && token.split('.').length === 2);

    const decoded = verifySessionToken(token);
    assert.ok(decoded !== null);
    assert.equal(decoded?.userId, sessionData.userId);
    assert.equal(decoded?.role, 'EMPLOYEE');
    assert.equal(decoded?.name, sessionData.name);
    assert.equal(decoded?.employeeCode, sessionData.employeeCode);

    // Tampered token check
    const tamperedToken = token.slice(0, -5) + 'abcde';
    const invalidDecoded = verifySessionToken(tamperedToken);
    assert.equal(invalidDecoded, null);
  });
});
