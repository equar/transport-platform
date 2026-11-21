import { MemoryRouter, Routes, Route } from "react-router-dom";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AuthenticatorCard } from "./AuthenticatorCard";
import { apiClient } from "../../../shared/api/client";
const signOut = vi.hoisted(() => vi.fn());
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ signOut }) }));
vi.mock("../../../shared/api/client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
  unwrapResponse: (body: { data: unknown }) => body.data,
  getApiErrorMessage: () => "Failed",
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("supports keyboard enrollment and keeps recovery codes until explicitly saved", async () => {
  vi.mocked(apiClient.get).mockResolvedValue({
    data: { data: { enabled: false, available: true, required: true } },
  });
  vi.mocked(apiClient.post)
    .mockResolvedValueOnce({
      data: {
        data: { secret: "TESTSETUPKEY", account: "admin", expiresAt: "" },
      },
    })
    .mockResolvedValueOnce({
      data: { data: { recoveryCodes: ["recovery-1", "recovery-2"] } },
    });
  render(<AuthenticatorCard />);
  const password = await screen.findByLabelText("Current password");
  fireEvent.change(password, { target: { value: "PrivatePassword" } });
  const form = password.closest("form");
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
  const code = await screen.findByLabelText("Authenticator or recovery code");
  fireEvent.change(code, { target: { value: "123456" } });
  fireEvent.submit(form!);
  await screen.findByLabelText("Recovery codes");
  expect(signOut).not.toHaveBeenCalled();
  expect(vi.mocked(apiClient.post).mock.calls.map((call) => call[0])).toEqual([
    "/v1/auth/mfa/setup",
    "/v1/auth/mfa/activate",
  ]);
  fireEvent.click(
    screen.getByRole("button", {
      name: "I saved my recovery codes — sign in again",
    }),
  );
  await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
});

it('offers Skip for now when enrollment is optional and returns to sign-in without enabling MFA',async()=>{
  vi.mocked(apiClient.get).mockResolvedValue({data:{data:{enabled:false,available:true,required:false}}});
  render(<MemoryRouter initialEntries={['/account/authenticator']}><Routes><Route path="/account/authenticator" element={<AuthenticatorCard />} /><Route path="/login" element={<div>Sign-in screen</div>} /></Routes></MemoryRouter>);
  const skip=await screen.findByRole('link',{name:'Skip for now'});
  fireEvent.click(skip);
  await screen.findByText('Sign-in screen');
  expect(signOut).toHaveBeenCalledTimes(1);expect(apiClient.post).not.toHaveBeenCalled();
});
it('does not offer Skip for required enrollment or an already-enabled authenticator',async()=>{
  vi.mocked(apiClient.get).mockResolvedValue({data:{data:{enabled:false,available:true,required:true}}});
  render(<AuthenticatorCard />);await screen.findByLabelText('Current password');
  expect(screen.queryByRole('link',{name:'Skip for now'})).toBeNull();
  cleanup();
  vi.mocked(apiClient.get).mockResolvedValue({data:{data:{enabled:true,available:true,required:false}}});
  render(<AuthenticatorCard />);await screen.findByLabelText('Current password');
  expect(screen.queryByRole('link',{name:'Skip for now'})).toBeNull();
});
