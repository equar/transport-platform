import {
  act,
  cleanup,
  render,
  screen,
  fireEvent,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { dashboardApi } from "../api/dashboardApi";
vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: () => ({
    session: {
      identity: {
        id: 1,
        tenantId: "tenant-a",
        firstName: "Admin",
        roles: ["ROLE_TENANT_ADMIN"],
      },
    },
  }),
}));
vi.mock("../api/dashboardApi", () => ({
  dashboardApi: { getCompanySummary: vi.fn(), getPlatformSummary: vi.fn() },
}));
afterEach(cleanup);
it("exposes driver, rider, guardian, ride and billing metrics instead of silently dropping them", async () => {
  vi.mocked(dashboardApi.getCompanySummary).mockResolvedValue({
    totalDrivers: 21,
    totalRiders: 42,
    totalGuardians: 35,
    totalRides: 900,
    recentActivity: [],
    completedRides: 800,
    activeDrivers: 18,
    activeRiders: 40,
    ridesInProgress: 6,
    overdueAmount: 120,
  } as never);
  await act(async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
  });
  for (const label of [
    "Total Drivers",
    "Total Riders",
    "Total Guardians",
    "Total Rides",
    "Completed Rides",
    "Outstanding Balance",
  ])
    expect(screen.getByText(label)).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "View all historical activity" })
      .getAttribute("href"),
  ).toBe("/company/audit-logs");
  fireEvent.click(
    screen.getByRole("button", { name: "Billing and receivables" }),
  );
  expect(screen.getByText("$120.00")).toBeTruthy();
});
