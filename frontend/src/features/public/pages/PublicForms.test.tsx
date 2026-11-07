import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ContactPage } from './ContactPage';
import { ForgotPasswordPage } from '../../auth/pages/ForgotPasswordPage';
const mocks=vi.hoisted(()=>({post:vi.fn(),requestPasswordReset:vi.fn()}));
vi.mock('../../../shared/api/client',()=>({apiClient:{post:mocks.post}}));
vi.mock('../../auth/api/authApi',()=>({authApi:{requestPasswordReset:mocks.requestPasswordReset}}));
afterEach(cleanup);beforeEach(()=>vi.resetAllMocks());
function contact() {
  render(<MemoryRouter><ContactPage /></MemoryRouter>);
  for(const [label,value] of [['Full Name','Taylor'],['Company','Transit'],['Work Email','test@example.com'],['Phone','555-0100'],['What are you solving for?','Dispatch scheduling']]) {
    fireEvent.change(screen.getByLabelText(new RegExp(label.replace('?','\\?'))),{target:{value}});
  }
  fireEvent.submit(screen.getByRole('button',{name:'Request demo'}).closest('form')!);
}
it('captures demo input and shows success only after the server accepts it',async()=>{
  let accept!: (value: unknown)=>void;
  mocks.post.mockReturnValue(new Promise(resolve=>{accept=resolve;}));contact();
  expect(screen.queryByText(/Thanks. Your request/)).toBeNull();
  expect(mocks.post).toHaveBeenCalledWith('/demo-inquiries',{name:'Taylor',company:'Transit',email:'test@example.com',phone:'555-0100',message:'Dispatch scheduling'});
  accept({data:{success:true}});await screen.findByText(/Thanks. Your request/);
});
it('keeps demo details available for retry after a server failure',async()=>{
  mocks.post.mockRejectedValue(new Error('offline'));contact();
  await screen.findByText(/Your request could not be sent/);
  expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe('Taylor');
  expect(screen.queryByText(/Thanks. Your request/)).toBeNull();
});
it('displays a recovery error and permits another attempt',async()=>{
  mocks.requestPasswordReset.mockRejectedValueOnce(new Error('unavailable')).mockResolvedValueOnce({message:'Instructions sent if this account exists.'});
  render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText(/Work Email/),{target:{value:'test@example.com'}});
  fireEvent.submit(screen.getByRole('button',{name:'Send recovery instructions'}).closest('form')!);
  await screen.findByText(/Recovery instructions could not be requested/);
  fireEvent.submit(screen.getByRole('button',{name:'Send recovery instructions'}).closest('form')!);
  await waitFor(()=>expect(mocks.requestPasswordReset).toHaveBeenCalledTimes(2));
  await screen.findByText('Instructions sent if this account exists.');
});
