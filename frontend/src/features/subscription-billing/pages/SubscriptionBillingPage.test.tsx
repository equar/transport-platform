import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SubscriptionBillingPage } from "./SubscriptionBillingPage";
import { subscriptionBillingApi as api } from "../api/subscriptionBillingApi";
const auth = vi.hoisted(() => ({ roles: ["ROLE_PLATFORM_ADMIN"] }));
vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: () => ({ session: { identity: { roles: auth.roles } } }),
}));
vi.mock("../api/subscriptionBillingApi", () => ({
  subscriptionBillingApi: {
    accounts: vi.fn(),
    invoices: vi.fn(),
    configure: vi.fn(),
    payment: vi.fn(),
    detail: vi.fn(),
    generate: vi.fn(),
  },
}));
const account = {
  subscriptionId: 7,
  tenantId: "tenant-a",
  tenantName: "Transport A",
  planCode: "STARTER",
  subscriptionStatus: "ACTIVE",
  enabled: false,
  monthlyDriverRate: null,
  currency: "USD",
  firstRenewalDate: null,
  nextRenewalDate: null,
  nextRenewalAt: null,
  paymentDueDays: 14,
  collectionMode: "MANUAL",
  automaticAvailable: false,
  activeDrivers: 2,
  pendingRateDate: null,
  pendingRate: null,
};
const invoice = {
  id: 10,
  subscriptionId: 7,
  tenantId: "tenant-a",
  tenantName: "Transport A",
  planCode: "STARTER",
  periodStart: "2026-11-20",
  periodEnd: "2026-12-20",
  dueDate: "2026-12-04",
  meteredAt: "2026-11-20T12:00:00Z",
  driverCount: 2,
  driverIdsJson: "[1,2]",
  monthlyDriverRate: 25,
  currency: "USD",
  amount: 50,
  paidAmount: 0,
  collectionMode: "MANUAL",
  collectionState: "NOT_ATTEMPTED",
  status: "ISSUED",
  createdAt: "2026-11-20T12:00:00Z",
};
beforeEach(() => {
  vi.clearAllMocks();
  auth.roles = ["ROLE_PLATFORM_ADMIN"];
  vi.mocked(api.accounts).mockResolvedValue({
    items: [account],
    totalElements: 21,
    totalPages: 3,
    page: 0,
    size: 10,
  } as never);
  vi.mocked(api.invoices).mockResolvedValue({
    items: [invoice],
    totalElements: 11,
    totalPages: 2,
    page: 0,
    size: 10,
  } as never);
  vi.mocked(api.configure).mockResolvedValue(account as never);
  vi.mocked(api.payment).mockResolvedValue(invoice as never);
});
afterEach(cleanup);
async function open() {
  await act(async () => {
    render(
      <MemoryRouter>
        <SubscriptionBillingPage />
      </MemoryRouter>,
    );
  });
}
it("lets platform admins configure the USD monthly driver rate without enabling automatic collection", async () => {
  await open();
  fireEvent.click(screen.getByRole("button", { name: "Configure billing" }));
  fireEvent.change(
    screen.getByLabelText("Monthly price per active driver (USD)"),
    { target: { value: "25.50" } },
  );
  fireEvent.change(screen.getByLabelText("First renewal date (UTC)"), {
    target: { value: "2026-12-01" },
  });
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: "Enable scheduled monthly invoicing",
    }),
  );
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Save billing configuration" }),
    );
  });
  expect(api.configure).toHaveBeenCalledWith(7, {
    monthlyDriverRate: 25.5,
    firstRenewalDate: "2026-12-01",
    paymentDueDays: 14,
    collectionMode: "MANUAL",
    enabled: true,
  });
});
it("records funds received with a unique reference and permits partial payments", async () => {
  await open();
  fireEvent.click(screen.getByRole("button", { name: "Record payment" }));
  fireEvent.change(screen.getByLabelText("Amount received (USD)"), {
    target: { value: "20" },
  });
  fireEvent.change(screen.getByLabelText("Unique payment reference"), {
    target: { value: "BANK-2026-11-20-1" },
  });
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Record received payment" }),
    );
  });
  expect(api.payment).toHaveBeenCalledWith(10, 20, "BANK-2026-11-20-1");
});
it("shows companies their own subscription invoices without billing mutation controls", async () => {
  auth.roles = ["ROLE_TENANT_ADMIN"];
  await open();
  expect(api.accounts).toHaveBeenCalledWith(false, 0, 10);
  expect(api.invoices).toHaveBeenCalledWith(false, 0, 10);
  expect(
    screen.queryByRole("button", { name: "Configure billing" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Record payment" })).toBeNull();
  expect(screen.getByText("SUB-10")).toBeTruthy();
});
it("blocks manual receipts while an automatic collection is unresolved", async () => {
  vi.mocked(api.invoices).mockResolvedValue({
    items: [
      { ...invoice, collectionMode: "AUTOMATIC", collectionState: "PENDING" },
    ],
    totalElements: 1,
    totalPages: 1,
    page: 0,
    size: 10,
  } as never);
  await open();
  expect(
    screen
      .getByRole("button", { name: "Record payment" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
it("keeps a failed payment form open and paginates both record lists", async () => {
  await open();
  const next = screen.getAllByRole("button", { name: "Go to next page" });
  await act(async () => {
    fireEvent.click(next[0]);
    fireEvent.click(next[1]);
  });
  expect(api.accounts).toHaveBeenLastCalledWith(true, 1, 10);
  expect(api.invoices).toHaveBeenLastCalledWith(true, 1, 10);
  fireEvent.click(screen.getByRole("button", { name: "Record payment" }));
  fireEvent.change(screen.getByLabelText("Unique payment reference"), {
    target: { value: "BANK-1" },
  });
  vi.mocked(api.payment).mockRejectedValueOnce(new Error("Unavailable"));
  await act(async () => {
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Record received payment",
      }),
    );
  });
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(
    (screen.getByLabelText("Unique payment reference") as HTMLInputElement)
      .value,
  ).toBe("BANK-1");
});
