import { expect, it } from 'vitest';
import { crashDetails } from './crashDetails';
it('groups build frame locations without transmitting messages, URLs or credentials', () => {
  const result=crashDetails({ name:'TypeError', stack:'TypeError: private rider name\n at render (https://example.test/assets/App-abc.js:12:34?token=secret)' });
  expect(result.frames).toBe('App-abc.js:12:34');
  expect(JSON.stringify(result)).not.toMatch(/private|secret|example/);
  expect(result.fingerprint).toMatch(/^[a-f0-9]{8}$/);
  expect(crashDetails({name:'TypeError',stack:' at render (App-abc.js:12:34)'}).fingerprint).toBe(result.fingerprint);
});
