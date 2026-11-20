import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PlatformAdminProfilePage } from "./PlatformAdminProfilePage";
import { authApi } from "../api/authApi";
const signOut = vi.hoisted(() => vi.fn());
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    session: { identity: { email: "admin@example.test" } },
    signOut,
  }),
}));
vi.mock("../api/authApi", () => ({ authApi: { changePassword: vi.fn() } }));
vi.mock("../../../shared/providers/ToastProvider", () => ({
  useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
}));
vi.mock("../../../shared/components/AppearancePreferenceCard", () => ({
  AppearancePreferenceCard: () => null,
}));
afterEach(cleanup);
it("places password fields in one form with autofill hints and submits through the form", async () => {
  vi.mocked(authApi.changePassword).mockResolvedValue({
    message: "Password updated.",
  });
  render(<PlatformAdminProfilePage />);
  const current = screen.getByLabelText("Current Password") as HTMLInputElement;
  const next = screen.getByLabelText("New Password") as HTMLInputElement;
  const confirmation = screen.getByLabelText(
    "Confirm New Password",
  ) as HTMLInputElement;
  expect(current.form).not.toBeNull();
  expect(next.form).toBe(current.form);
  expect(confirmation.form).toBe(current.form);
  expect(current.autocomplete).toBe("current-password");
  expect(next.autocomplete).toBe("new-password");
  fireEvent.change(current, { target: { value: "Old-password-123" } });
  fireEvent.change(next, { target: { value: "New-password-456" } });
  fireEvent.change(confirmation, { target: { value: "New-password-456" } });
  fireEvent.submit(current.form!);
  await waitFor(() =>
    expect(authApi.changePassword).toHaveBeenCalledWith({
      currentPassword: "Old-password-123",
      newPassword: "New-password-456",
    }),
  );
  await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
});
