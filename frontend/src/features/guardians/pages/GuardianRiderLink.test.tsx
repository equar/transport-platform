vi.mock("../../../shared/components/RecordHistoryPanel", () => ({ RecordHistoryPanel: () => null }));
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
import { guardiansApi } from "../api/guardiansApi";
import { ridersApi } from "../../riders/api/ridersApi";
import { GuardianDetailsPage } from "./GuardianDetailsPage";

vi.mock("../api/guardiansApi", async (original) => ({
  ...(await original<object>()),
  guardiansApi: { getById: vi.fn() },
}));
vi.mock("../../riders/api/ridersApi", async (original) => ({
  ...(await original<object>()),
  ridersApi: {
    search: vi.fn(),
    linkGuardian: vi.fn(),
    unlinkGuardian: vi.fn(),
  },
}));
const toast = vi.hoisted(() => ({ showError: vi.fn(), showSuccess: vi.fn() }));
vi.mock("../../../shared/providers/ToastProvider", () => ({
  useToast: () => toast,
}));
const guardian = {
  id: 20,
  firstName: "Morgan",
  lastName: "Lee",
  phone: "5551112222",
  status: "ACTIVE",
  riders: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};
const rider = { id: 10, firstName: "Alex", lastName: "Lee", riderCode: "R-10" };
const link = {
  relationshipId: 30,
  riderId: 10,
  riderCode: "R-10",
  riderDisplayName: "Alex Lee",
  riderType: "STUDENT",
  riderStatus: "ACTIVE",
  relationshipType: "PARENT",
  status: "ACTIVE",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.mocked(guardiansApi.getById).mockResolvedValue(guardian as never);
  vi.mocked(ridersApi.search).mockResolvedValue({
    items: [rider],
    totalPages: 3,
    page: 0,
    size: 25,
    totalElements: 51,
  } as never);
  vi.mocked(ridersApi.linkGuardian).mockResolvedValue({} as never);
  vi.mocked(ridersApi.unlinkGuardian).mockResolvedValue({} as never);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
async function openPage() {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={["/company/guardians/20?link=1"]}>
        <Routes>
          <Route
            path="/company/guardians/:guardianId"
            element={<GuardianDetailsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}
function chooseRider() {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Rider" }));
  fireEvent.click(screen.getByRole("option", { name: "Alex Lee • R-10" }));
}
it("links a rider with explicit relationship permissions and refreshes the guardian", async () => {
  await openPage();
  chooseRider();
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Authorized for Pickup" }),
  );
  vi.mocked(guardiansApi.getById).mockResolvedValue({
    ...guardian,
    riders: [link],
  } as never);
  await act(async () => {
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Link Rider",
      }),
    );
  });
  expect(ridersApi.linkGuardian).toHaveBeenCalledWith(10, {
    guardianId: 20,
    relationshipType: "PARENT",
    primaryGuardian: false,
    authorizedForPickup: true,
    billingContact: false,
    notes: "",
  });
  expect(screen.getByText("Alex Lee")).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(300); });
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Unlink Rider" }));
  vi.mocked(guardiansApi.getById).mockResolvedValue(guardian as never);
  await act(async () => {
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Unlink Rider",
      }),
    );
  });
  expect(ridersApi.unlinkGuardian).toHaveBeenCalledWith(30);
  expect(screen.getByText("No records found")).toBeTruthy();
});
it("searches all tenant riders with pagination and disables already linked riders", async () => {
  vi.mocked(guardiansApi.getById).mockResolvedValue({
    ...guardian,
    riders: [link],
  } as never);
  await openPage();
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Rider" }));
  expect(
    screen
      .getByRole("option", { name: /Already linked/ })
      .getAttribute("aria-disabled"),
  ).toBe("true");
  fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  expect(ridersApi.search).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 1 }),
  );
  fireEvent.change(screen.getByLabelText("Search riders"), {
    target: { value: "Alex" },
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  expect(ridersApi.search).toHaveBeenLastCalledWith(
    expect.objectContaining({ keyword: "Alex", page: 0 }),
  );
});
it("retains the form when saving fails and allows search retries", async () => {
  vi.mocked(ridersApi.search).mockRejectedValueOnce(new Error("Unavailable"));
  await openPage();
  expect(screen.getByRole("alert")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  chooseRider();
  vi.mocked(ridersApi.linkGuardian).mockRejectedValueOnce(
    new Error("Access denied"),
  );
  await act(async () => {
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Link Rider",
      }),
    );
  });
  expect(toast.showError).toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByRole("combobox", { name: "Rider" }).textContent).toContain(
    "Alex Lee",
  );
});
