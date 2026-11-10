import { passwordValidationError } from './passwordPolicy';
import { expect, it } from 'vitest';
it('enforces the shared encoder capacity for ASCII and multibyte passwords', () => {
  expect(passwordValidationError('safe12345')).toBeNull();
  expect(passwordValidationError('é'.repeat(36))).toBeNull();
  expect(passwordValidationError('a'.repeat(73))).toContain('too long');
  expect(passwordValidationError('é'.repeat(37))).toContain('too long');
  expect(passwordValidationError('short')).toContain('at least 8');
});
