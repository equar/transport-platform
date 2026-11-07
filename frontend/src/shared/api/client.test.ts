import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosAdapter } from 'axios';
import { afterEach, expect, it, vi } from 'vitest';
import { apiClient, setApiSession } from './client';
const originalAdapter=apiClient.defaults.adapter;
afterEach(()=>{apiClient.defaults.adapter=originalAdapter;setApiSession(null);vi.restoreAllMocks();});
it('never refreshes or replays an old account request using a newly signed-in account',async()=>{
  const refresh=vi.spyOn(axios,'post');let rejectRequest!: (error: Error)=>void;let config!: InternalAxiosRequestConfig;
  let started!: ()=>void;const ready=new Promise<void>(resolve=>{started=resolve;});
  const adapter=vi.fn((request:InternalAxiosRequestConfig)=>{config=request;started();return new Promise((_,reject)=>{rejectRequest=reject;});});
  apiClient.defaults.adapter=adapter as AxiosAdapter;
  setApiSession({accessToken:'account-a',identity:{id:1,tenantId:'a'}});
  const request=apiClient.get('/company/rides/1');const assertion=expect(request).rejects.toThrow('expired');
  await ready;setApiSession({accessToken:'account-b',identity:{id:2,tenantId:'b'}});
  rejectRequest(new AxiosError('expired','ERR_BAD_REQUEST',config,undefined,{status:401,statusText:'Unauthorized',headers:{},config,data:{}}));
  await assertion;expect(adapter).toHaveBeenCalledTimes(1);expect(refresh).not.toHaveBeenCalled();
});
