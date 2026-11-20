import { vehiclesApi } from "../../features/vehicles/api/vehiclesApi";
import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { DriverDetailsPage } from "../../features/drivers/pages/DriverDetailsPage";
import { RideDetailsPage } from "../../features/rides/pages/RideDetailsPage";
import { driversApi } from "../../features/drivers/api/driversApi";
import { ridesApi } from "../../features/rides/api/ridesApi";
import { dispatchApi } from "../../features/dispatch/api/dispatchApi";
vi.mock("./RecordHistoryPanel", () => ({ RecordHistoryPanel: () => null }));
vi.mock("../providers/ToastProvider", () => ({
  useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
}));
vi.mock("../../features/drivers/api/driversApi", async (original) => ({
  ...(await original<object>()),
  driversApi: { getById: vi.fn(), listAllDocuments: vi.fn() },
}));
vi.mock("../../features/rides/api/ridesApi", async (original) => ({
  ...(await original<object>()),
  ridesApi: {
    getById: vi.fn(),
    getEvents: vi.fn(),
    getLocationSnapshot: vi.fn(),
  },
}));
vi.mock("../../features/dispatch/api/dispatchApi", () => ({
  dispatchApi: { listDriverOptions: vi.fn(), listVehicleOptions: vi.fn() },
}));
vi.mock("../../features/vehicles/api/vehiclesApi", () => ({
  vehiclesApi: { getById: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("keeps all driver profile fields visible when documents fail to load", async () => {
  vi.mocked(driversApi.getById).mockResolvedValue({
    id: 7,
    firstName: "Alex",
    middleName: "Morgan",
    lastName: "Lee",
    driverCode: "DRV-7",
    status: "ACTIVE",
    driverType: "EMPLOYEE",
    backgroundCheckStatus: "CLEAR",
    drugTestStatus: "CLEAR",
    trainingStatus: "COMPLETED",
    dateOfBirth: "1988-04-12",
    hireDate: "2025-01-15",
    startDate: "2025-02-01",
    availabilitySummary: "Weekdays",
    backgroundCheckExpiryDate: "2027-04-12",
    drugTestExpiryDate: "2027-03-15",
    trainingCompletionDate: "2026-01-10",
    complianceSummary: {
      overallStatus: "COMPLIANT",
      missingRequiredDocumentTypes: [],
    },
  } as never);
  vi.mocked(driversApi.listAllDocuments).mockRejectedValue(
    new Error("Document service unavailable"),
  );
  await act(async () => {
    render(
      <MemoryRouter initialEntries={["/company/drivers/7"]}>
        <Routes>
          <Route
            path="/company/drivers/:driverId"
            element={<DriverDetailsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );
  });
  expect(screen.getByText("Alex Morgan Lee")).toBeTruthy();
  expect(screen.getByText("Availability: Weekdays")).toBeTruthy();
  expect(
    screen.getByText(/Background Check Expiry: Apr 12, 2027/),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  expect(screen.queryByText("No driver documents")).toBeNull();
});
it("retains ride and quote details when events or location are unavailable", async () => {
  vi.mocked(ridesApi.getById).mockResolvedValue({
    id: 10,
    rideNumber: "TRIP-10",
    riderId: 5,
    driverId: 7,
    vehicleId: 9,
    riderName: "Alex Morgan Lee",
    riderCode: "RDR-5",
    status: "COMPLETED",
    serviceType: "GENERAL_TRANSPORT",
    tripType: "ONE_WAY",
    scheduledPickupAt: "2026-11-20T09:00:00",
    pickupAddressLine1: "1 Main Street",
    dropoffAddressLine1: "2 Main Street",
    quotedPrice: 75,
    companionCount: 0,
  } as never);
  vi.mocked(driversApi.getById).mockResolvedValue({
    id: 7,
    firstName: "Archived",
    lastName: "Driver",
    driverCode: "DRV-7",
    status: "INACTIVE",
  } as never);
  vi.mocked(vehiclesApi.getById).mockResolvedValue({
    id: 9,
    vehicleCode: "VEH-9",
    make: "Ford",
    model: "Transit",
    plateNumber: "TEST-9",
    status: "INACTIVE",
  } as never);
  vi.mocked(ridesApi.getEvents).mockRejectedValue(new Error("Unavailable"));
  vi.mocked(ridesApi.getLocationSnapshot).mockRejectedValue(
    new Error("Unavailable"),
  );
  vi.mocked(dispatchApi.listDriverOptions).mockResolvedValue([]);
  vi.mocked(dispatchApi.listVehicleOptions).mockResolvedValue([]);
  await act(async () => {
    render(
      <MemoryRouter initialEntries={["/company/rides/10"]}>
        <Routes>
          <Route path="/company/rides/:rideId" element={<RideDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  expect(screen.getByText("TRIP-10")).toBeTruthy();
  expect(screen.getByText("75.00")).toBeTruthy();
  expect(screen.getByText("Archived Driver (DRV-7)")).toBeTruthy();
  expect(screen.getByText("VEH-9 · Ford Transit · TEST-9")).toBeTruthy();
  expect(
    screen.getByText(
      /Some supporting information could not be loaded: ride events, location/,
    ),
  ).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "View rider" }).getAttribute("href"),
  ).toBe("/company/riders/5");
});
