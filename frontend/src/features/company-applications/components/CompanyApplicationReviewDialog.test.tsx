import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CompanyApplicationReviewDialog } from "./CompanyApplicationReviewDialog";

afterEach(cleanup);

it("marks the provisioning password as new instead of an existing login credential", () => {
  render(<CompanyApplicationReviewDialog open mode="approve" application={null}
    onClose={vi.fn()} onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/^Temporary Owner Password/).getAttribute("autocomplete")).toBe("new-password");
  expect(screen.getByLabelText(/^Owner Email/).getAttribute("autocomplete")).toBe("off");
});
