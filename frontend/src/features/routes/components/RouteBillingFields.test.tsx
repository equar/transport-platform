import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { RouteBillingFields } from "./RouteBillingFields";
import type { RoutePayload } from "../api/routesApi";
const search = vi.hoisted(() => vi.fn().mockResolvedValue([{ id: 9, label: "School district", secondaryLabel: "Organization" }]));
vi.mock("../../billing/api/billingApi", () => ({
  billingApi: { searchBillToOptions: search }, billToTypeOptions: ["RIDER", "GUARDIAN", "ORGANIZATION", "CONTRACT"],
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function Form({ priced = false }: { priced?: boolean }) {
  const [value, setValue] = useState<RoutePayload>({ routeName: "School route", routeDate: "2026-11-23",
    serviceType: "GENERAL_TRANSPORT", billingTripType: "ONE_WAY", price: priced ? 125 : null,
    roundTripPrice: 200, billToType: priced ? "ORGANIZATION" : null, billToId: null });
  return <RouteBillingFields value={value} onChange={setValue} />;
}
it("keeps a blank price manual and switches to auto draft instructions when a price is set", () => {
  render(<Form />);
  expect(screen.getByText(/tenant admin creates the invoice manually/i)).toBeTruthy();
  expect(screen.queryByLabelText(/Billing account type/)).toBeNull();
  fireEvent.change(screen.getByLabelText("One-way price (USD)"), { target: { value: "125.50" } });
  expect(screen.getByText(/one draft invoice/)).toBeTruthy();
  expect(screen.getByLabelText(/Billing account type/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("One-way price (USD)"), { target: { value: "" } });
  expect(screen.getByText(/tenant admin creates the invoice manually/i)).toBeTruthy();
});
it("loads tenant billing accounts for selection on a priced route", async () => {
  render(<Form priced />);
  await waitFor(() => expect(search).toHaveBeenCalledWith("ORGANIZATION", ""));
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Billing account' }));
  await waitFor(() => expect(screen.getByText("School district")).toBeTruthy());
});
