import { requestErrorMessage } from './requestError';
it('gives connection and session recovery instructions', () => {
  expect(requestErrorMessage({ code: 'ERR_NETWORK' })).toMatch(/connection/);
  expect(requestErrorMessage({ response: { status: 401 } })).toMatch(/Sign in/);
  expect(requestErrorMessage({ response: { status: 404 } })).toMatch(/refresh the list/);
});
it('does not expose server internals for service failures', () => {
  expect(requestErrorMessage({ response: { status: 500, data: { error: { message: 'SQLException password=secret' } } } })).toBe('The service is temporarily unavailable. Please try again shortly.');
  expect(requestErrorMessage(new Error('raw stack'))).not.toContain('raw stack');
});
it('preserves actionable server validation messages', () => {
  expect(requestErrorMessage({ response: { status: 400, data: { error: { message: 'Enter a valid pickup address.' } } } })).toBe('Enter a valid pickup address.');
});
