import { expect, it } from 'vitest';
import { retryAfterDelay } from './client';
it('honors seconds and HTTP dates without accepting an invalid or negative delay', () => {
  expect(retryAfterDelay('60')).toBe(60_000);
  expect(retryAfterDelay('Sat, 21 Nov 2026 15:01:00 GMT', Date.parse('2026-11-21T15:00:00Z'))).toBe(60_000);
  expect(retryAfterDelay('not a date')).toBeNull();
  expect(retryAfterDelay(undefined)).toBeNull();
});

it('waits for a case-insensitive Retry-After header before retrying a GET', async () => {
  const { vi } = await import('vitest');
  const { apiClient } = await import('./client');
  const { AxiosError } = await import('axios');
  const original=apiClient.defaults.adapter;
  vi.useFakeTimers();let calls=0;
  try {
    apiClient.defaults.adapter=async config=>{
      calls++;
      if(calls===1) throw new AxiosError('throttled','ERR_BAD_REQUEST',config,undefined,{config,status:429,statusText:'Too Many Requests',headers:{'Retry-After':'1'},data:{}});
      return {config,status:200,statusText:'OK',headers:{},data:{success:true}};
    };
    const request=apiClient.get('/rate-limit-probe');
    await vi.advanceTimersByTimeAsync(999);expect(calls).toBe(1);
    await vi.advanceTimersByTimeAsync(1);await request;expect(calls).toBe(2);
  } finally { apiClient.defaults.adapter=original;vi.useRealTimers(); }
});
