import { afterEach, expect, it, vi } from "vitest";
import { normalizeBusinessError } from "./businessError";

afterEach(() => vi.restoreAllMocks());

it("preserves a business message returned by the API", () => {
  const message =
    "This guardian is already linked to this rider. Use the existing guardian link to update the relationship.";
  const error = {
    isAxiosError: true,
    response: {
      status: 409,
      data: { error: { code: "RESOURCE_CONFLICT", message } },
    },
  };

  expect(normalizeBusinessError(error, "The guardian link could not be saved.").message).toBe(
    message,
  );
});

it("uses the business fallback instead of exposing an unexpected exception", () => {
  expect(
    normalizeBusinessError(
      new Error("SQL constraint violation: rider_guardian_unique"),
      "The guardian link could not be saved.",
    ).message,
  ).toBe("The guardian link could not be saved.");
  expect(
    normalizeBusinessError(
      "SQL constraint violation: rider_guardian_unique",
      "The guardian link could not be saved.",
    ).message,
  ).toBe("The guardian link could not be saved.");
});

it("describes invalid fields from the API validation details", () => {
  const error = {
    isAxiosError: true,
    response: {
      status: 400,
      data: {
        error: {
          code: "VALIDATION_FAILED",
          message: "Some submitted fields are missing or invalid. Review the field details and try again.",
          details: { fieldErrors: { "rider.firstName": "must not be blank" } },
        },
      },
    },
  };

  expect(normalizeBusinessError(error, "The rider could not be saved.").message).toBe(
    "Please correct: First Name: must not be blank.",
  );
});

it("uses the operation-specific fallback for unexpected server errors", () => {
  const error = {
    isAxiosError: true,
    response: {
      status: 500,
      data: { error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." } },
    },
  };

  expect(
    normalizeBusinessError(error, "The guardian link could not be saved.").message,
  ).toBe("The guardian link could not be saved.");
});
