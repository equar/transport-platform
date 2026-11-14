import { apiClient, unwrapResponse } from "../../../shared/api/client";

export type DriverEarningsStatus = "PENDING_CALCULATION" | "PENDING_REVIEW" | "APPROVED";

export interface DriverEarningsEntry {
  id: number;
  driverId: number;
  driverName: string | null;
  rideId: number | null;
  rideNumber: string | null;
  entryType: string;
  status: DriverEarningsStatus;
  amount: number | null;
  currency: string;
  billableAmount: number | null;
  earningsRate: number | null;
  reason: string | null;
  createdAt: string;
}

export const driverEarningsApi = {
  async list() {
    return unwrapResponse<DriverEarningsEntry[]>((await apiClient.get("/company/driver-earnings")).data);
  },
  async getRate() {
    return unwrapResponse<number | null>((await apiClient.get("/company/driver-earnings/rate")).data);
  },
  async setRate(rate: number) {
    return unwrapResponse<number>((await apiClient.put("/company/driver-earnings/rate", { rate })).data);
  },
  async updateEntry(id: number, amount: number, reason: string) {
    return unwrapResponse<DriverEarningsEntry>(
      (await apiClient.put(`/company/driver-earnings/${id}`, { amount, reason })).data,
    );
  },
  async approve(id: number) {
    return unwrapResponse<DriverEarningsEntry>(
      (await apiClient.post(`/company/driver-earnings/${id}/approve`)).data,
    );
  },
  async adjust(driverId: number, amount: number, reason: string) {
    return unwrapResponse<DriverEarningsEntry>(
      (await apiClient.post("/company/driver-earnings/adjustments", { driverId, amount, reason })).data,
    );
  },
};
