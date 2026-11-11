import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { VerifyApplicationEmailPage } from "./VerifyApplicationEmailPage";
import { authApi } from "../api/authApi";

vi.mock("../api/authApi", () => ({ authApi: { verifyApplicationEmail: vi.fn(), resendApplicationVerification: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

it("verifies application email explicitly without asking for a password or email", async () => {
  vi.mocked(authApi.verifyApplicationEmail).mockResolvedValue({ message: "Ready for administrator review." });
  render(<MemoryRouter initialEntries={["/verify-application-email#token=test-token"]}><VerifyApplicationEmailPage /></MemoryRouter>);
  expect(authApi.verifyApplicationEmail).not.toHaveBeenCalled();
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.queryByLabelText(/password/i)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Verify email" }));
  await waitFor(() => expect(screen.getByText("Ready for administrator review.")).toBeTruthy());
  expect(authApi.verifyApplicationEmail).toHaveBeenCalledWith("test-token");
});

it("requests a replacement by application reference, not email", async () => {
  vi.mocked(authApi.resendApplicationVerification).mockResolvedValue({ message: "A replacement will be sent." });
  render(<MemoryRouter initialEntries={["/verify-application-email"]}><VerifyApplicationEmailPage /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText(/^Application reference/), { target: { value: "APP-1" } });
  fireEvent.click(screen.getByRole("button", { name: "Send a new verification link" }));
  await waitFor(() => expect(authApi.resendApplicationVerification).toHaveBeenCalledWith("APP-1"));
});
