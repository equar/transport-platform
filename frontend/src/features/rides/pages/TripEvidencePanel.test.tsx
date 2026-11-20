import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TripEvidencePanel } from "./TripEvidencePanel";
import { PortalDeliveryEvidence } from "./PortalDeliveryEvidence";
import { apiClient } from "../../../shared/api/client";
vi.mock("../../../shared/api/client", () => ({
  apiClient: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
  unwrapResponse: (r: { data: unknown }) => r.data,
  getApiErrorMessage: () => "Request failed",
}));
const data = {
  stops: null,
  milestones: [],
  confirmation: null,
  readyToComplete: false,
  canConfirm: false,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiClient.get).mockResolvedValue({ data: { data } });
  vi.mocked(apiClient.put).mockResolvedValue({
    data: {
      data: {
        ...data,
        stops: {
          pickupLatitude: 42,
          pickupLongitude: -71,
          dropoffLatitude: 42.01,
          dropoffLongitude: -71.01,
        },
      },
    },
  });
});
afterEach(cleanup);
it("requires both verified stop coordinates and sends their numeric values", async () => {
  render(<TripEvidencePanel rideId={12} status="ASSIGNED" />);
  await screen.findByRole("button", { name: "Verify booked stop coordinates" });
  for (const [label, value] of [
    ["Pickup latitude", "42"],
    ["Pickup longitude", "-71"],
    ["Drop-off latitude", "42.01"],
    ["Drop-off longitude", "-71.01"],
  ])
    fireEvent.change(screen.getByLabelText(new RegExp(label)), {
      target: { value },
    });
  fireEvent.click(
    screen.getByRole("button", { name: "Verify booked stop coordinates" }),
  );
  await waitFor(() =>
    expect(apiClient.put).toHaveBeenCalledWith(
      "/company/rides/12/delivery-evidence/stops",
      {
        pickupLatitude: 42,
        pickupLongitude: -71,
        dropoffLatitude: 42.01,
        dropoffLongitude: -71.01,
      },
    ),
  );
});
it("locks stop editing once milestone evidence has been recorded", async () => {
  vi.mocked(apiClient.get).mockResolvedValue({
    data: {
      data: {
        ...data,
        milestones: [
          {
            id: 1,
            milestone: "ARRIVED",
            distanceMeters: 10,
            accuracyMeters: 5,
            odometerMiles: null,
            recordedAt: "2026-11-20T12:00:00Z",
            consumedAt: null,
          },
        ],
      },
    },
  });
  render(<TripEvidencePanel rideId={12} status="DRIVER_EN_ROUTE" />);
  await screen.findByText("ARRIVED");
  expect(
    screen.queryByRole("button", { name: "Verify booked stop coordinates" }),
  ).toBeNull();
});
it("requires explicit passenger confirmation of the displayed drop-off", async () => {
  const milestone = {
    id: 17,
    milestone: "DROPPED_OFF",
    distanceMeters: 10,
    accuracyMeters: 5,
    odometerMiles: 100,
    recordedAt: "2026-11-20T12:00:00Z",
    consumedAt: "2026-11-20T12:00:01Z",
  };
  vi.mocked(apiClient.get).mockResolvedValue({
    data: { data: { ...data, canConfirm: true, milestones: [milestone] } },
  });
  vi.mocked(apiClient.post).mockResolvedValue({
    data: {
      data: {
        ...data,
        confirmation: {
          confirmerName: "Guardian",
          subjectType: "GUARDIAN",
          confirmedAt: "2026-11-20T12:00:02Z",
        },
      },
    },
  });
  render(
    <PortalDeliveryEvidence
      rideId={12}
      status="DROPPED_OFF"
      destination="Clinic"
    />,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Confirm rider was delivered" }),
  );
  expect(apiClient.post).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Yes, confirm delivery" }),
  );
  await waitFor(() =>
    expect(apiClient.post).toHaveBeenCalledWith(
      "/portal/rider/rides/12/delivery-evidence/confirm",
      { dropoffEvidenceId: 17, delivered: true },
    ),
  );
});

it("does not carry verified coordinates into another ride", async () => {
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    data: {
      data: {
        ...data,
        stops: {
          pickupLatitude: 42,
          pickupLongitude: -71,
          dropoffLatitude: 42.01,
          dropoffLongitude: -71.01,
        },
      },
    },
  });
  const view = render(<TripEvidencePanel rideId={12} status="ASSIGNED" />);
  await waitFor(() =>
    expect(
      (screen.getByLabelText(/Pickup latitude/) as HTMLInputElement).value,
    ).toBe("42"),
  );
  view.rerender(<TripEvidencePanel rideId={13} status="ASSIGNED" />);
  await waitFor(() =>
    expect(
      (screen.getByLabelText(/Pickup latitude/) as HTMLInputElement).value,
    ).toBe(""),
  );
});
