import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FILTEC_HQ,
  calculateDistanceMeters,
  formatDistanceToFiltec,
  formatDistanceShort
} from '../distance.ts';

describe('GPS Distance Calculation Utilities', () => {
  it('measures 0 meters when coordinate is identical to HQ', () => {
    const distance = calculateDistanceMeters(FILTEC_HQ.latitude, FILTEC_HQ.longitude);
    assert.equal(distance, 0);
  });

  it('correctly calculates known distance from Bhubaneswar Railway Station to Filtec HQ', () => {
    // Bhubaneswar Railway station ~ 20.2667, 85.8436
    const distance = calculateDistanceMeters(20.2667, 85.8436);
    // Approximately 10km to 11km
    assert.ok(distance > 9000 && distance < 13000, `Expected distance ~10-12km, got ${distance}`);
  });

  it('formats distance correctly into badges and human-readable text', () => {
    assert.equal(formatDistanceShort(25), 'On-site');
    assert.equal(formatDistanceShort(450), '450 m');
    assert.equal(formatDistanceShort(12500), '12.5 km');

    assert.equal(formatDistanceToFiltec(25), 'On-site (< 50m from Filtec HQ)');
    assert.equal(formatDistanceToFiltec(450), '450 m from Filtec HQ');
    assert.equal(formatDistanceToFiltec(12500), '12.5 km from Filtec HQ');
  });

  it('safely handles missing or null coordinates', () => {
    assert.equal(calculateDistanceMeters(undefined, undefined), 0);
    assert.equal(calculateDistanceMeters(null, null), 0);
    assert.equal(formatDistanceToFiltec(null), '—');
    assert.equal(formatDistanceShort(null), '—');
  });
});
