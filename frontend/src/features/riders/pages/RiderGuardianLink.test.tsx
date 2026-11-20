import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { guardiansApi } from "../../guardians/api/guardiansApi";
import { ridersApi } from "../api/ridersApi";
import { RiderDetailsPage } from "./RiderDetailsPage";
vi.mock("../../guardians/api/guardiansApi", async (original) => ({
  ...(await original<object>()),
  guardiansApi: { search: vi.fn() },
}));
vi.mock("../api/ridersApi", async (original) => ({
  ...(await original<object>()),
  ridersApi: {
    getById: vi.fn(),
    linkGuardian: vi.fn(),
    updateGuardianLink: vi.fn(),
    unlinkGuardian: vi.fn(),
  },
}));
vi.mock("../../../shared/providers/ToastProvider", () => ({
  useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
}));
const rider = {
  id: 10,
  firstName: "Alex",
  lastName: "Lee",
  riderCode: "R-10",
  riderType: "STUDENT",
  status: "ACTIVE",
  mobilityNeeds: [],
  guardians: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};
const guardian = {
  id: 20,
  firstName: "Morgan",
  lastName: "Lee",
  email: "morgan@example.com",
  phone: "5551112222",
  status: "ACTIVE",
};
const link = {
  id: 30,
  guardianId: 20,
  guardianDisplayName: "Morgan Lee",
  guardianStatus: "ACTIVE",
  relationshipType: "PARENT",
  status: "ACTIVE",
  primaryGuardian: true,
  authorizedForPickup: false,
  billingContact: false,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.mocked(ridersApi.getById).mockResolvedValue(rider as never);
  vi.mocked(guardiansApi.search).mockResolvedValue({
    items: [guardian],
    totalPages: 5,
    totalElements: 101,
    page: 0,
    size: 25,
  } as never);
  vi.mocked(ridersApi.linkGuardian).mockResolvedValue({} as never);
  vi.mocked(ridersApi.updateGuardianLink).mockResolvedValue({} as never);
  vi.mocked(ridersApi.unlinkGuardian).mockResolvedValue({} as never);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
async function openPage() {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={["/company/riders/10?link=1"]}>
        <Routes>
          <Route
            path="/company/riders/:riderId"
            element={<RiderDetailsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}
it("associates a guardian from the rider page and refreshes the relationship", async () => {
  await openPage();
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Guardian" }));
  fireEvent.click(screen.getByRole("option", { name: /Morgan Lee/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Billing Contact" }));
  vi.mocked(ridersApi.getById).mockResolvedValue({
    ...rider,
    guardians: [link],
  } as never);
  await act(async () => {
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Link Guardian",
      }),
    );
  });
  expect(ridersApi.linkGuardian).toHaveBeenCalledWith(
    10,
    expect.objectContaining({
      guardianId: 20,
      billingContact: true,
      authorizedForPickup: false,
    }),
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByText("Morgan Lee")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Update Guardian Link" }));
  expect(
    screen.getByRole("combobox", { name: "Guardian" }).textContent,
  ).toContain("Morgan Lee");
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  });
  expect(ridersApi.updateGuardianLink).toHaveBeenCalledWith(
    30,
    expect.objectContaining({ guardianId: 20 }),
  );
});
it("searches and paginates guardians beyond the first 100 without duplicates", async () => {
  vi.mocked(ridersApi.getById).mockResolvedValue({
    ...rider,
    guardians: [link],
  } as never);
  await openPage();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  expect(guardiansApi.search).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 1, size: 25 }),
  );
  fireEvent.change(screen.getByLabelText("Search guardians"), {
    target: { value: "Morgan" },
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  expect(guardiansApi.search).toHaveBeenLastCalledWith(
    expect.objectContaining({ keyword: "Morgan", page: 0 }),
  );
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Guardian" }));
  expect(
    screen
      .getByRole("option", { name: /Morgan Lee/ })
      .getAttribute("aria-disabled"),
  ).toBe("true");
});
