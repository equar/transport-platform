import { expect, it, vi } from 'vitest';
import { withSessionCookieLock } from './sessionLock';
it('serializes shared-cookie work through the browser-wide lock', async () => {
  let tail = Promise.resolve();
  const request = vi.fn((_name: string, work: () => Promise<unknown>) => {
    const next = tail.then(work); tail = next.then(() => undefined); return next;
  });
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } });
  const calls: number[] = [];
  await Promise.all([withSessionCookieLock(async () => { calls.push(1); await Promise.resolve(); calls.push(2); }),
    withSessionCookieLock(async () => { calls.push(3); })]);
  expect(calls).toEqual([1, 2, 3]);
  expect(request).toHaveBeenCalledTimes(2);
  Reflect.deleteProperty(navigator, 'locks');
});
