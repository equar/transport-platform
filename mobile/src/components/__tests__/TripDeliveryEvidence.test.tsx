import React from "react";
import { Alert } from "react-native";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TripDeliveryEvidence } from "../TripDeliveryEvidence";
import { tripEvidenceApi } from "@api/tripEvidenceApi";
let mockVisible = true;
jest.mock("@hooks/useTripScreenVisible", () => ({
  useTripScreenVisible: () => mockVisible,
  manualTripRefreshOptions: { retry: false, refetchInterval: false },
}));
jest.mock("@api/tripEvidenceApi", () => ({
  tripEvidenceApi: { get: jest.fn(), confirm: jest.fn() },
}));
jest.mock("@expo/vector-icons", () => ({ MaterialCommunityIcons: "Icon" }));
const clients: QueryClient[] = [];
const evidence = {
  stops: null,
  milestones: [
    {
      id: 17,
      milestone: "DROPPED_OFF",
      distanceMeters: 10,
      accuracyMeters: 5,
      odometerMiles: 110,
      recordedAt: "2026-11-20T12:00:00Z",
      consumedAt: "2026-11-20T12:00:01Z",
    },
  ],
  confirmation: null,
  canConfirm: true,
  readyToComplete: false,
};
beforeEach(() => {
  jest.clearAllMocks();
  mockVisible = true;
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.mocked(tripEvidenceApi.get).mockResolvedValue(evidence);
  jest
    .mocked(tripEvidenceApi.confirm)
    .mockResolvedValue({
      ...evidence,
      canConfirm: false,
      confirmation: {
        confirmerName: "Guardian",
        subjectType: "GUARDIAN",
        confirmedAt: "2026-11-20T12:00:02Z",
      },
    });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((c) => c.clear());
  jest.restoreAllMocks();
});
function open(driver = false) {
  const c = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  clients.push(c);
  render(
    <QueryClientProvider client={c}>
      <TripDeliveryEvidence
        rideId={10}
        status="DROPPED_OFF"
        driver={driver}
        destination="Clinic, Main Street"
      />
    </QueryClientProvider>,
  );
}
it("requires explicit passenger attestation and binds it to the displayed drop-off evidence", async () => {
  open();
  await screen.findByText("Booked destination: Clinic, Main Street");
  fireEvent.press(
    await screen.findByRole("button", { name: "Confirm rider was delivered" }),
  );
  expect(tripEvidenceApi.confirm).not.toHaveBeenCalled();
  const buttons = jest.mocked(Alert.alert).mock.calls[0][2]!;
  await act(async () => {
    buttons.find((b) => b.text === "Yes, confirm delivery")!.onPress!();
  });
  await waitFor(() =>
    expect(tripEvidenceApi.confirm).toHaveBeenCalledWith(10, 17),
  );
});
it("never offers driver confirmation and explains the required independent app confirmation", async () => {
  open(true);
  await screen.findByText(/Awaiting delivery confirmation/);
  expect(
    screen.queryByRole("button", { name: "Confirm rider was delivered" }),
  ).toBeNull();
  expect(tripEvidenceApi.get).toHaveBeenCalledWith(10, true);
});
it("does not load evidence while the screen is out of view", () => {
  mockVisible = false;
  open();
  expect(tripEvidenceApi.get).not.toHaveBeenCalled();
});
