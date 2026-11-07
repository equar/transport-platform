import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosAdapter } from 'axios';
import { apiClient, invalidateSessionRequests } from './client';
import { getSessionValue } from '../auth/sessionStorage';
jest.mock('expo-constants',()=>({__esModule:true,default:{expoConfig:{extra:{apiBaseUrl:'https://example.test/api'}}}}));
jest.mock('../auth/sessionStorage',()=>({getSessionValue:jest.fn(),setSessionValue:jest.fn(),deleteSessionValue:jest.fn()}));
const originalAdapter=apiClient.defaults.adapter;
afterEach(()=>{apiClient.defaults.adapter=originalAdapter;jest.restoreAllMocks();invalidateSessionRequests();});
it('does not refresh or replay a previous account’s request after an account change',async()=>{
  jest.mocked(getSessionValue).mockResolvedValue(JSON.stringify({accessToken:'a',refreshToken:'a-refresh',identity:{id:1,tenantId:'a'}}));
  const refresh=jest.spyOn(axios,'post');let rejectRequest!: (error:Error)=>void;let config!:InternalAxiosRequestConfig;
  let started!:()=>void;const ready=new Promise<void>(resolve=>{started=resolve;});
  const adapter=jest.fn((request:InternalAxiosRequestConfig)=>{config=request;started();return new Promise((_,reject)=>{rejectRequest=reject;});});
  apiClient.defaults.adapter=adapter as AxiosAdapter;
  const request=apiClient.get('/portal/driver/rides/1');const assertion=expect(request).rejects.toThrow('expired');
  await ready;invalidateSessionRequests();
  jest.mocked(getSessionValue).mockResolvedValue(JSON.stringify({accessToken:'b',refreshToken:'b-refresh',identity:{id:2,tenantId:'b'}}));
  rejectRequest(new AxiosError('expired','ERR_BAD_REQUEST',config,undefined,{status:401,statusText:'Unauthorized',headers:{},config,data:{}}));
  await assertion;expect(adapter).toHaveBeenCalledTimes(1);expect(refresh).not.toHaveBeenCalled();
});
it('discards a successful response after the account changes', async () => {
  jest.mocked(getSessionValue).mockResolvedValue(JSON.stringify({ accessToken: 'a', identity: { id: 1, tenantId: 'a' } }));
  let finish!: (value: unknown) => void;
  let started!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  apiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) => new Promise(resolve => {
    finish = data => resolve({ config, data, status: 200, statusText: 'OK', headers: {} }); started();
  })) as AxiosAdapter;
  const request = apiClient.get('/portal/rider/rides');
  const assertion = expect(request).rejects.toThrow('The account changed.');
  await ready; invalidateSessionRequests(); finish({ riders: ['tenant-a-private-data'] });
  await assertion;
});
it('does not send a request if account ownership changes during secure-storage access', async () => {
  let complete!: (value: string) => void;
  let started!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  jest.mocked(getSessionValue).mockImplementationOnce(() => new Promise(resolve => { complete = resolve; started(); }));
  const adapter = jest.fn(); apiClient.defaults.adapter = adapter as AxiosAdapter;
  const request = apiClient.post('/portal/driver/rides/1/actions');
  const assertion = expect(request).rejects.toThrow('The account changed.');
  await ready; invalidateSessionRequests();
  complete(JSON.stringify({ accessToken: 'b', identity: { id: 2, tenantId: 'b' } }));
  await assertion; expect(adapter).not.toHaveBeenCalled();
});
