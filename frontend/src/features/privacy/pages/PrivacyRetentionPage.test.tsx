import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PrivacyRetentionPage } from "./PrivacyRetentionPage";
import { apiClient } from "../../../shared/api/client";
const auth = vi.hoisted(() => ({ roles: ["ROLE_PLATFORM_ADMIN"] }));
vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: () => ({ session: { identity: { roles: auth.roles } } }),
}));
vi.mock("../../../shared/api/client", () => ({
  apiClient: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
  unwrapResponse: (r: { data: unknown }) => r.data,
  getApiErrorMessage: () => "Request failed",
}));
const platform = {
  scope: "PLATFORM",
  operationalReviewDays: 365,
  auditDays: 180,
  notificationDays: 30,
  cleanupEnabled: false,
  legalHold: false,
};
beforeEach(() => {
  vi.clearAllMocks();
  auth.roles = ["ROLE_PLATFORM_ADMIN"];
  vi.mocked(apiClient.get).mockImplementation(async (url) => ({
    data: {
      data: String(url).endsWith("review-candidates")
        ? []
        : {
            platform,
            override: platform,
            effective: platform,
            platformScope: true,
          },
    },
  }));
  vi.mocked(apiClient.put).mockResolvedValue({ data: { data: {} } });
});
afterEach(cleanup);
function open() {
  render(
    <MemoryRouter>
      <PrivacyRetentionPage />
    </MemoryRouter>,
  );
}
it("requires explicit confirmation before enabling irreversible secondary-record cleanup", async () => {
  open();
  await screen.findByRole("button", { name: "Save retention policy" });
  fireEvent.change(screen.getByLabelText("Audit log retention (days)"), {
    target: { value: "90" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Save retention policy" }),
  );
  expect(apiClient.put).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Apply policy" }));
  await waitFor(() =>
    expect(apiClient.put).toHaveBeenCalledWith(
      "/platform/privacy-retention",
      expect.objectContaining({
        auditDays: 90,
        notificationDays: 30,
        cleanupEnabled: false,
        legalHold: false,
      }),
    ),
  );
});
it("shows inherited tenant durations and preserves a platform legal hold", async () => {
  auth.roles = ["ROLE_TENANT_ADMIN"];
  vi.mocked(apiClient.get).mockImplementation(async (url) => ({
    data: {
      data: String(url).endsWith("review-candidates")
        ? []
        : {
            platform: { ...platform, legalHold: true },
            override: {
              scope: "tenant-a",
              operationalReviewDays: null,
              auditDays: null,
              notificationDays: null,
              cleanupEnabled: null,
              legalHold: false,
            },
            effective: { ...platform, scope: "tenant-a", legalHold: true },
            platformScope: false,
          },
    },
  }));
  open();
  await screen.findByRole("button", { name: "Save retention policy" });
  expect(
    screen.getByText(/A platform legal hold cannot be overridden/),
  ).toBeTruthy();
  expect(
    (screen.getByLabelText("Audit log retention (days)") as HTMLInputElement)
      .value,
  ).toBe("");
  fireEvent.click(
    screen.getByRole("button", { name: "Save retention policy" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Apply policy" }));
  await waitFor(() =>
    expect(apiClient.put).toHaveBeenCalledWith(
      "/company/privacy-retention",
      expect.objectContaining({ auditDays: null, cleanupEnabled: null }),
    ),
  );
});
it("rejects non-positive retention durations without saving", async () => {
  open();
  await screen.findByRole("button", { name: "Save retention policy" });
  fireEvent.change(screen.getByLabelText("Audit log retention (days)"), {
    target: { value: "0" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Save retention policy" }),
  );
  expect(screen.getByText(/Enter approved durations/)).toBeTruthy();
  expect(apiClient.put).not.toHaveBeenCalled();
});
