const assert = require('node:assert/strict');
const merge = require('deepmerge');
for (const key of ['__proto__', 'constructor', 'prototype']) {
  const payload = Object.create(null);
  payload[key] = { poisoned: true };
  for (const value of [merge(Object.create(null), payload), merge(payload, {})]) {
    assert.equal(Object.getPrototypeOf(value), Object.prototype);
    assert.equal(value.poisoned, undefined);
    assert.equal(Object.hasOwn(value, key), false);
  }
}
assert.deepEqual(merge({ values: [1], nested: { a: 1 } }, { values: [2], nested: { b: 2 } }),
  { values: [1, 2], nested: { a: 1, b: 2 } });
console.log('Deepmerge prototype guards and normal configuration merging passed.');
