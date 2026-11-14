import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import type { GuardianRecord } from "../../guardians/api/guardiansApi";
import { GuardianLinkDialog } from "./GuardianLinkDialog";

afterEach(cleanup);

const guardian: GuardianRecord = {
  id: 20,
  tenantId: "tenant-a",
  firstName: "Morgan",
  middleName: null,
  lastName: "Lee",
  relationToRiderDefault: "Parent",
  email: "morgan@example.com",
  phone: "555 111 2222",
  alternatePhone: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  zipCode: null,
  country: null,
  preferredCommunicationMethod: null,
  billingContact: false,
  authorizedForPickup: true,
  notes: null,
  status: "ACTIVE",
  createdBy: "admin",
  createdAt: "2025-01-01T00:00:00Z",
  updatedBy: "admin",
  updatedAt: "2025-01-01T00:00:00Z",
  linkedRiderCount: 1,
  riders: [],
};

it("explains that an already-linked guardian cannot be linked again", () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <MemoryRouter>
      <GuardianLinkDialog
        open
        guardians={[guardian]}
        linkedGuardianIds={[guardian.id]}
        relationship={null}
        loading={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    </MemoryRouter>,
  );

  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Guardian" }));
  fireEvent.click(screen.getByRole("option", { name: /Morgan Lee/ }));
  fireEvent.click(screen.getByRole("button", { name: "Link Guardian" }));

  expect(
    screen.getByText(
      "This guardian is already linked to this rider. Use Update Guardian Link to change the relationship.",
    ),
  ).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
});
