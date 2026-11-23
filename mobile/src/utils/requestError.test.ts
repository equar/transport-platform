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

it('shows field corrections and a server-provided retry delay', () => {
  expect(requestErrorMessage({ response: { status: 422, data: { error: { details: { fieldErrors: { phone: 'Enter a valid phone number.' } } } } } })).toBe('Enter a valid phone number.');
  expect(requestErrorMessage({ response: { status: 429, headers: { 'retry-after': '45' } } })).toContain('45 seconds');
});

it('distinguishes rejected sign-in details from an expired existing session', () => {
  expect(requestErrorMessage({ config: { url: '/v1/auth/login' }, response: { status: 401, data: { error: { message: 'Enter a valid authenticator code.' } } } })).toBe('Enter a valid authenticator code.');
  expect(requestErrorMessage({ config: { url: '/v1/auth/login' }, response: { status: 401 } })).toContain('email, password');
  expect(requestErrorMessage({ config: { url: '/portal/rider/rides' }, response: { status: 401 } })).toContain('session has expired');
});
