import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateShares, filterProperties, properties } from '../public/model.js';

test('fractional illustration computes the expected investment and income', () => {
  assert.deepEqual(calculateShares(5), { shares: 5, investment: 250000, ownership: 5, quarterlyIncome: 5500 });
  assert.equal(calculateShares(1).quarterlyIncome, 1100);
  assert.equal(calculateShares(100).investment, 5000000);
});
test('share count stays within the ownership bounds and uses whole shares', () => {
  assert.equal(calculateShares(-5).shares, 1);
  assert.equal(calculateShares(500).ownership, 100);
  assert.equal(calculateShares('invalid').shares, 1);
  assert.equal(calculateShares(2.6).shares, 3);
});
test('city and ownership filters combine and support an empty result', () => {
  assert.equal(filterProperties().length, properties.length);
  assert.equal(filterProperties('fractional', 'Mumbai')[0].id, 'horizon');
  assert.equal(filterProperties('buy', 'Mumbai').length, 0);
  assert.equal(filterProperties('rto', 'Bengaluru').length, 2);
});
