import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SubscriptionPlanManagementPage } from "./SubscriptionPlanManagementPage";
import { saasAdminApi as api } from "../api/saasAdminApi";
vi.mock("../api/saasAdminApi", () => ({
  saasAdminApi: {
    searchSubscriptionPlans: vi.fn(),
    getSubscriptionPlan: vi.fn(),
    updateSubscriptionPlan: vi.fn(),
  },
}));
vi.mock("../../../shared/providers/ToastProvider", () => ({
  useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
}));
const summary = {
  id: 1,
  planCode: "STARTER",
  name: "Starter",
  tier: "STARTER" as const,
  monthlyPrice: 10,
  annualPrice: 100,
  currency: "USD",
  maxUsers: 10,
  maxDrivers: 5,
  maxVehicles: 5,
  status: "ACTIVE" as const,
};
const detail = {
  ...summary,
  description: "Keep description",
  notes: "Keep notes",
  maxRiders: 73,
  maxOrganizations: 9,
  includedFeatureCodes: ["TRACKING", "BILLING"],
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.searchSubscriptionPlans).mockResolvedValue({
    items: [summary],
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
  });
  vi.mocked(api.getSubscriptionPlan).mockResolvedValue(detail);
  vi.mocked(api.updateSubscriptionPlan).mockResolvedValue(detail);
});
afterEach(cleanup);
async function edit() {
  render(<SubscriptionPlanManagementPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Edit plan" }));
}
it("loads the full plan from a summary row and preserves omitted fields when saving", async () => {
  await edit();
  await screen.findByRole("dialog");
  expect(api.getSubscriptionPlan).toHaveBeenCalledWith(1);
  expect(
    (screen.getByLabelText("Included feature codes") as HTMLInputElement).value,
  ).toBe("TRACKING, BILLING");
  expect((screen.getByLabelText("Max riders") as HTMLInputElement).value).toBe(
    "73",
  );
  fireEvent.change(screen.getByLabelText("Plan name"), {
    target: { value: "Updated Starter" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  await waitFor(() =>
    expect(api.updateSubscriptionPlan).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        name: "Updated Starter",
        description: "Keep description",
        notes: "Keep notes",
        maxRiders: 73,
        maxOrganizations: 9,
        includedFeatureCodes: ["TRACKING", "BILLING"],
      }),
    ),
  );
});
it("does not open or save an incomplete plan when loading details fails", async () => {
  vi.mocked(api.getSubscriptionPlan).mockRejectedValue(new Error("offline"));
  await edit();
  await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(api.updateSubscriptionPlan).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Edit plan" }));
  await waitFor(() => expect(api.getSubscriptionPlan).toHaveBeenCalledTimes(2));
});
it("opens a plan without feature codes safely", async () => {
  vi.mocked(api.getSubscriptionPlan).mockResolvedValue({
    ...detail,
    includedFeatureCodes: undefined as unknown as string[],
  });
  await edit();
  await screen.findByRole("dialog");
  expect(
    (screen.getByLabelText("Included feature codes") as HTMLInputElement).value,
  ).toBe("");
});
