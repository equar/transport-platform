import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosAdapter } from 'axios';
import { afterEach, expect, it, vi } from 'vitest';
import { apiClient, setApiSession, captureTenantRequestScope } from './client';
const originalAdapter=apiClient.defaults.adapter;
afterEach(()=>{apiClient.defaults.adapter=originalAdapter;setApiSession(null);vi.restoreAllMocks();});
it.each(['/v1/auth/verify-email', '/v1/auth/resend-verification'])(
  'sends public onboarding request %s without existing account credentials',
  async path => {
    setApiSession({accessToken:'old-account',identity:{id:1,tenantId:'other-tenant'}});
    let captured!: InternalAxiosRequestConfig;
    apiClient.defaults.adapter=(async config=>{
      captured=config;
      return {config,data:{success:true,data:'Accepted'},status:200,statusText:'OK',headers:{}};
    }) as AxiosAdapter;
    await apiClient.post(path,{}, {headers:{Authorization:'Bearer old-account','X-Tenant-Id':'other-tenant'}});
    expect(captured.headers.get('Authorization')).toBeUndefined();
    expect(captured.headers.get('X-Tenant-Id')).toBeUndefined();
  },
);
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
it('discards a successful response that arrives after switching tenants', async () => {
  let finish!: (value: unknown) => void;
  let started!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  apiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) => new Promise(resolve => {
    finish = data => resolve({ config, data, status: 200, statusText: 'OK', headers: {} }); started();
  })) as AxiosAdapter;
  setApiSession({ accessToken: 'tenant-a', identity: { id: 1, tenantId: 'a' } });
  const request = apiClient.get('/company/riders');
  const assertion = expect(request).rejects.toThrow('The account changed.');
  await ready;
  setApiSession({ accessToken: 'tenant-b', identity: { id: 2, tenantId: 'b' } });
  finish({ riders: ['tenant-a-private-data'] });
  await assertion;
});
it('preserves document FormData instead of serializing the file as JSON', async () => {
  const file=new File(['%PDF-1.4 test document'],'test.pdf',{type:'application/pdf'});
  const form=new FormData();form.append('documentType','DRIVER_LICENSE');form.append('file',file);
  let captured!:InternalAxiosRequestConfig;
  apiClient.defaults.adapter=(async config=>{captured=config;return {config,data:{success:true,data:{}},status:201,statusText:'Created',headers:{}};}) as AxiosAdapter;
  await apiClient.post('/company/drivers/10/documents/upload',form,{headers:{'Content-Type':'application/json'}});
  expect(captured.data).toBeInstanceOf(FormData);
  expect(captured.data.get('file')).toBe(file);
  expect(captured.data.get('documentType')).toBe('DRIVER_LICENSE');
  expect(captured.headers.get('Content-Type')).not.toContain('application/json');
});
it('still serializes ordinary API object bodies as JSON', async () => {
  let captured!:InternalAxiosRequestConfig;
  apiClient.defaults.adapter=(async config=>{captured=config;return {config,data:{success:true,data:{}},status:200,statusText:'OK',headers:{}};}) as AxiosAdapter;
  await apiClient.post('/company/drivers',{firstName:'Taylor'});
  expect(captured.data).toBe(JSON.stringify({firstName:'Taylor'}));
  expect(captured.headers.get('Content-Type')).toContain('application/json');
});

it('rejects a prepared financial request before attaching another account credentials', async () => {
  setApiSession({ accessToken: 'a', identity: { id: 1, tenantId: 'tenant-a' } });
  const scope = captureTenantRequestScope();
  const adapter = vi.fn(); apiClient.defaults.adapter = adapter as AxiosAdapter;
  setApiSession({ accessToken: 'b', identity: { id: 2, tenantId: 'tenant-b' } });
  await expect(apiClient.post('/company/invoices/generate', {}, scope.config)).rejects.toThrow('The account changed.');
  expect(adapter).not.toHaveBeenCalled();
});
it('requires a tenant and user before capturing a financial retry scope', () => {
  setApiSession(null);
  expect(() => captureTenantRequestScope()).toThrow('authenticated company account');
  setApiSession({ accessToken: 'platform', identity: { id: 1, tenantId: null } });
  expect(() => captureTenantRequestScope()).toThrow('authenticated company account');
});

it('refreshes using the HttpOnly cookie without stale bearer or tenant headers',async()=>{
  setApiSession({accessToken:'restricted-token',identity:{id:1,tenantId:'previous-tenant'}});
  let captured!:InternalAxiosRequestConfig;
  apiClient.defaults.adapter=(async config=>{captured=config;return {config,data:{success:true,data:{}},status:200,statusText:'OK',headers:{}};}) as AxiosAdapter;
  await apiClient.post('/v1/auth/refresh',undefined,{headers:{Authorization:'Bearer stale','X-Tenant-Id':'old'}});
  expect(captured.headers.get('Authorization')).toBeUndefined();expect(captured.headers.get('X-Tenant-Id')).toBeUndefined();
});
it('invalidates stale admin authorization on MFA-required 403 without refreshing or replaying the action',async()=>{
  setApiSession({accessToken:'old-admin',identity:{id:1,tenantId:null}});
  const invalidated=vi.fn();window.addEventListener('transport-platform.auth.invalidated',invalidated);
  const refresh=vi.spyOn(axios,'post');
  const adapter=vi.fn(async(config:InternalAxiosRequestConfig)=>{throw new AxiosError('MFA required','ERR_BAD_REQUEST',config,undefined,{status:403,statusText:'Forbidden',headers:{},config,data:{success:false,error:{details:{authAction:'ENROLL_MFA'}}}});});
  apiClient.defaults.adapter=adapter as AxiosAdapter;
  try {await expect(apiClient.get('/platform/subscription-plans')).rejects.toThrow('MFA required');expect(adapter).toHaveBeenCalledTimes(1);expect(refresh).not.toHaveBeenCalled();
    expect(invalidated).toHaveBeenCalledTimes(1);
  } finally {window.removeEventListener('transport-platform.auth.invalidated',invalidated);}
});

it('keeps an authenticated session for an ordinary permission-denied 403',async()=>{
  setApiSession({accessToken:'valid-admin',identity:{id:1,tenantId:null}});
  const invalidated=vi.fn();window.addEventListener('transport-platform.auth.invalidated',invalidated);
  apiClient.defaults.adapter=(async config=>{throw new AxiosError('Forbidden','ERR_BAD_REQUEST',config,undefined,{status:403,statusText:'Forbidden',headers:{},config,data:{error:{details:{}}}});}) as AxiosAdapter;
  try {await expect(apiClient.get('/platform/subscription-plans')).rejects.toThrow('Forbidden');expect(invalidated).not.toHaveBeenCalled();}
  finally {window.removeEventListener('transport-platform.auth.invalidated',invalidated);}
});
