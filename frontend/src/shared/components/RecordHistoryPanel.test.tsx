import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RecordHistoryPanel } from "./RecordHistoryPanel";
import { auditLogsApi } from "../../features/audit/api/auditLogsApi";
import { ridesApi } from "../../features/rides/api/ridesApi";
const auth = vi.hoisted(() => ({ roles: ["ROLE_TENANT_ADMIN"] }));
vi.mock("../../features/auth/context/AuthContext", () => ({
  useAuth: () => ({ session: { identity: { roles: auth.roles } } }),
}));
vi.mock("../../features/audit/api/auditLogsApi", () => ({
  auditLogsApi: { search: vi.fn() },
}));
vi.mock("../../features/rides/api/ridesApi", () => ({
  ridesApi: { history: vi.fn() },
}));
const event = {
  id: 1,
  entityType: "RIDER_GUARDIAN",
  entityId: "30",
  module: "RIDER_GUARDIAN",
  action: "UNLINKED",
  createdAt: "2026-11-20T01:00:00Z",
  actorName: "Admin",
  summary: "Guardian removed",
  oldValueJson: '{"authorizedForPickup":true}',
  newValueJson: '{"authorizedForPickup":false}',
};
beforeEach(() => {
  vi.clearAllMocks();
  auth.roles = ["ROLE_TENANT_ADMIN"];
  vi.mocked(auditLogsApi.search).mockResolvedValue({
    items: [event],
    totalElements: 35,
    page: 0,
    size: 10,
    totalPages: 4,
  } as never);
  vi.mocked(ridesApi.history).mockResolvedValue({
    items: [
      {
        id: 10,
        rideNumber: "TRIP-10",
        riderName: "Alex Lee",
        status: "COMPLETED",
        scheduledPickupAt: "2026-11-20T01:00:00Z",
        pickupAddressLine1: "Pickup",
        dropoffAddressLine1: "Dropoff",
      },
    ],
    totalElements: 25,
    page: 0,
    size: 10,
    totalPages: 3,
  } as never);
});
afterEach(cleanup);
it("loads exact record history, paginates both lists, and exposes before/after changes", async () => {
  await act(async () => {
    render(
      <MemoryRouter>
        <RecordHistoryPanel entityType="GUARDIAN" entityId={20} />
      </MemoryRouter>,
    );
  });
  expect(auditLogsApi.search).toHaveBeenCalledWith(
    expect.objectContaining({
      entityType: "GUARDIAN",
      entityId: "20",
      page: 0,
    }),
  );
  expect(
    screen.getByRole("link", { name: "View ride" }).getAttribute("href"),
  ).toBe("/company/rides/10");
  expect(screen.getByText("Guardian removed")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "View changes" }));
  expect(screen.getByText(/"authorizedForPickup": true/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const next = screen.getAllByRole("button", { name: "Go to next page" });
  await act(async () => {
    fireEvent.click(next[0]);
    fireEvent.click(next[1]);
  });
  expect(ridesApi.history).toHaveBeenLastCalledWith("GUARDIAN", 20, 1, 10);
  expect(auditLogsApi.search).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 1 }),
  );
});
it("lets dispatchers see trips without requesting restricted audit logs", async () => {
  auth.roles = ["ROLE_DISPATCHER"];
  await act(async () => {
    render(
      <MemoryRouter>
        <RecordHistoryPanel entityType="DRIVER" entityId={7} />
      </MemoryRouter>,
    );
  });
  expect(ridesApi.history).toHaveBeenCalledWith("DRIVER", 7, 0, 10);
  expect(auditLogsApi.search).not.toHaveBeenCalled();
  expect(screen.queryByText("Activity History")).toBeNull();
});
it("handles a history failure independently and retries", async () => {
  vi.mocked(auditLogsApi.search).mockRejectedValueOnce(
    new Error("Unavailable"),
  );
  await act(async () => {
    render(
      <MemoryRouter>
        <RecordHistoryPanel entityType="RIDE" entityId={10} />
      </MemoryRouter>,
    );
  });
  expect(ridesApi.history).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toBeTruthy();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  });
  expect(screen.getByText("Guardian removed")).toBeTruthy();
});
