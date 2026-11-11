import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { authApi } from "../api/authApi";
import { AUTH_SESSION_STORAGE_KEY } from "../../../shared/config/storage";
import type { AuthSession } from "../types";

vi.mock("../api/authApi", () => ({
  authApi: { restoreSession: vi.fn(), signIn: vi.fn(), signOut: vi.fn() },
}));

function Probe() {
  const { isLoading, isAuthenticated } = useAuth();
  return <output>{isLoading ? "loading" : isAuthenticated ? "signed in" : "signed out"}</output>;
}

function mobileSession(role: string): AuthSession {
  return {
    accessToken: "legacy-mobile-role-web-token", tokenType: "Bearer", expiresInSeconds: 900,
    identity: {
      id: 1, email: "sample@example.test", firstName: "Test", lastName: "Sample",
      tenantId: "tenant-a", status: "ACTIVE", mustChangePassword: false, roles: [role],
    },
  };
}

beforeEach(() => { vi.clearAllMocks(); window.sessionStorage.clear(); });
afterEach(cleanup);

it.each(["ROLE_DRIVER", "ROLE_RIDER", "ROLE_GUARDIAN"])(
  "does not retain a persisted %s web session after rejected refresh",
  async role => {
    window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(mobileSession(role)));
    vi.mocked(authApi.restoreSession).mockRejectedValue(new Error("Use the mobile app."));
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("signed out")).toBeTruthy());
    expect(window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  },
);

it("rejects a mobile-role response from web session restoration", async () => {
  vi.mocked(authApi.restoreSession).mockResolvedValue(mobileSession("ROLE_RIDER"));
  render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(screen.getByText("signed out")).toBeTruthy());
  expect(window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
});
