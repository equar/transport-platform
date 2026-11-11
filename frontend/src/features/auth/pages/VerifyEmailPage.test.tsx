import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { VerifyEmailPage } from "./VerifyEmailPage";
import { authApi } from "../api/authApi";

vi.mock("../api/authApi", () => ({ authApi: { verifyEmail: vi.fn(), resendVerification: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function enterPassword(password = "My-new-password", confirmation = password) {
  fireEvent.change(screen.getByLabelText(/^New password/), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/^Confirm password/), { target: { value: confirmation } });
}

it("opens password creation without email entry and verifies only when submitted", async () => {
  vi.mocked(authApi.verifyEmail).mockResolvedValue({ message: "Your email address is verified." });
  render(<MemoryRouter initialEntries={["/verify-email#token=test-token"]}><VerifyEmailPage /></MemoryRouter>);
  expect(authApi.verifyEmail).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "Create your password" })).toBeTruthy();
  expect(screen.queryByRole("textbox", { name: /Owner email/ })).toBeNull();
  expect(screen.queryByRole("button", { name: "Send a new verification link" })).toBeNull();
  enterPassword();
  fireEvent.click(screen.getByRole("button", { name: "Create password" }));
  await waitFor(() => expect(screen.getByText("Your email address is verified.")).toBeTruthy());
  expect(authApi.verifyEmail).toHaveBeenCalledWith("test-token", "My-new-password");
  expect(screen.queryByLabelText(/^New password/)).toBeNull();
  expect(screen.getByText(/activate your workspace/)).toBeTruthy();
});

it("shows expired link errors and offers a replacement", async () => {
  vi.mocked(authApi.verifyEmail).mockRejectedValue({
    isAxiosError: true,
    response: { status: 400, data: { error: { message: "This verification link is invalid or expired." } } },
  });
  vi.mocked(authApi.resendVerification).mockResolvedValue({ message: "A new link will be emailed if eligible." });
  render(<MemoryRouter initialEntries={["/verify-email#token=expired-token"]}><VerifyEmailPage /></MemoryRouter>);
  enterPassword();
  fireEvent.click(screen.getByRole("button", { name: "Create password" }));
  await waitFor(() => expect(screen.getByText(/invalid or expired/)).toBeTruthy());
  expect(screen.queryByRole("textbox", { name: /Owner email/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Request a new setup link" }));
  fireEvent.change(screen.getByRole("textbox", { name: /Owner email/ }), { target: { value: "owner@example.test" } });
  fireEvent.click(screen.getByRole("button", { name: "Send a new verification link" }));
  await waitFor(() => expect(authApi.resendVerification).toHaveBeenCalledWith("owner@example.test"));
});

it("does not submit mismatched passwords", () => {
  render(<MemoryRouter initialEntries={["/verify-email#token=test-token"]}><VerifyEmailPage /></MemoryRouter>);
  enterPassword("My-new-password", "Different-password");
  fireEvent.click(screen.getByRole("button", { name: "Create password" }));
  expect(screen.getByText(/confirmation password must match/)).toBeTruthy();
  expect(authApi.verifyEmail).not.toHaveBeenCalled();
});

it("rejects passwords over the encoder byte limit", () => {
  render(<MemoryRouter initialEntries={["/verify-email#token=test-token"]}><VerifyEmailPage /></MemoryRouter>);
  enterPassword("\u00e9".repeat(37));
  fireEvent.click(screen.getByRole("button", { name: "Create password" }));
  expect(screen.getByText(/password is too long/)).toBeTruthy();
  expect(authApi.verifyEmail).not.toHaveBeenCalled();
});

it("offers email recovery only when opened without a link", () => {
  render(<MemoryRouter initialEntries={["/verify-email"]}><VerifyEmailPage /></MemoryRouter>);
  expect(screen.getByRole("textbox", { name: /Owner email/ })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Create password" })).toBeNull();
});
