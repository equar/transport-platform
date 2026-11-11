import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CompanyApplicationReviewDialog } from "./CompanyApplicationReviewDialog";

afterEach(cleanup);

it("does not ask the administrator for a temporary owner password", () => {
  render(<CompanyApplicationReviewDialog open mode="approve" application={null}
    onClose={vi.fn()} onSubmit={vi.fn()} />);
  expect(screen.queryByLabelText(/^Temporary Owner Password/)).toBeNull();
  expect(screen.getByLabelText(/^Owner Email/).getAttribute("autocomplete")).toBe("off");
  expect(screen.getByLabelText(/^Owner Email/).getAttribute("readonly")).not.toBeNull();
});
