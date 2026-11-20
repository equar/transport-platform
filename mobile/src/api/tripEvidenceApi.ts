import { apiClient, unwrapResponse } from "./client";
export interface TripEvidenceSummary {
  stops: {
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffLatitude: number;
    dropoffLongitude: number;
  } | null;
  milestones: {
    id: number;
    milestone: string;
    distanceMeters: number;
    accuracyMeters: number;
    odometerMiles: number | null;
    recordedAt: string;
    consumedAt: string | null;
  }[];
  confirmation: {
    confirmerName: string;
    subjectType: string;
    confirmedAt: string;
  } | null;
  canConfirm: boolean;
  readyToComplete: boolean;
}
const path = (rideId: number, driver: boolean) =>
  `/portal/${driver ? "driver" : "rider"}/rides/${rideId}/delivery-evidence`;
export const tripEvidenceApi = {
  async get(rideId: number, driver: boolean) {
    return unwrapResponse<TripEvidenceSummary>(
      (await apiClient.get(path(rideId, driver))).data,
    );
  },
  async capture(
    rideId: number,
    milestone: string,
    odometerMiles: number | undefined,
    mockedLocation: boolean,
  ) {
    return unwrapResponse<TripEvidenceSummary>(
      (
        await apiClient.post(`${path(rideId, true)}/milestones`, {
          milestone,
          odometerMiles,
          mockedLocation,
        })
      ).data,
    );
  },
  async confirm(rideId: number, dropoffEvidenceId: number) {
    return unwrapResponse<TripEvidenceSummary>(
      (
        await apiClient.post(`${path(rideId, false)}/confirm`, {
          dropoffEvidenceId,
          delivered: true,
        })
      ).data,
    );
  },
};
