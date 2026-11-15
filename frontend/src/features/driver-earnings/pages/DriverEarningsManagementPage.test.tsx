import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { driverEarningsApi, type DriverEarningsEntry } from "../api/driverEarningsApi";
import { DriverEarningsManagementPage } from "./DriverEarningsManagementPage";

vi.mock("../api/driverEarningsApi", () => ({
  driverEarningsApi: {
    list: vi.fn(),
    getRate: vi.fn(),
    setRate: vi.fn(),
    updateEntry: vi.fn(),
    approve: vi.fn(),
    adjust: vi.fn(),
  },
}));

const pendingCalculation: DriverEarningsEntry = {
  id: 7,
  driverId: 10,
  driverName: "Jordan Driver",
  rideId: 2,
  rideNumber: "TRIP-2",
  entryType: "EARNED",
  status: "PENDING_CALCULATION",
  amount: null,
  currency: "USD",
  billableAmount: null,
  earningsRate: null,
  reason: "Awaiting a tenant earnings rate and an issued invoice line for this ride.",
  createdAt: "2026-11-14T12:00:00Z",
};

const pendingReview: DriverEarningsEntry = {
  ...pendingCalculation,
  status: "PENDING_REVIEW",
  amount: 12.5,
  reason: "Manually set by the tenant administrator.",
};

const approved: DriverEarningsEntry = {
  ...pendingReview,
  status: "APPROVED",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(driverEarningsApi.list)
    .mockResolvedValueOnce([pendingCalculation])
    .mockResolvedValueOnce([pendingReview])
    .mockResolvedValue([approved]);
  vi.mocked(driverEarningsApi.getRate).mockResolvedValue(null);
  vi.mocked(driverEarningsApi.updateEntry).mockResolvedValue(pendingReview);
  vi.mocked(driverEarningsApi.approve).mockResolvedValue(approved);
});

afterEach(cleanup);

it("lets a tenant admin set an amount for a pending record and approve it", async () => {
  render(<DriverEarningsManagementPage />);

  expect(await screen.findByText("Jordan Driver")).toBeTruthy();
  expect(screen.getAllByText("Needs calculation")).toHaveLength(2);
  expect(screen.getByText(/Automatic calculation needs an earnings rate/)).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Set amount" }));
  await screen.findByRole("button", { name: "Submit for approval" });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Earnings amount" }), { target: { value: "12.50" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Reason for this amount" }), { target: { value: "Agreed trip amount" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit for approval" }));

  expect(await screen.findByRole("button", { name: "Approve" })).toBeTruthy();
  expect(driverEarningsApi.updateEntry).toHaveBeenCalledWith(7, 12.5, "Agreed trip amount");

  fireEvent.click(screen.getByRole("button", { name: "Approve" }));
  expect(await screen.findByText("Approved")).toBeTruthy();
  expect(driverEarningsApi.approve).toHaveBeenCalledWith(7);
});
