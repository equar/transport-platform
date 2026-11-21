import axios from "axios";
import type { ApiErrorResponse } from "./types";

export type BusinessErrorKind = "validation" | "authentication" | "authorization" | "conflict" | "not-found" | "network" | "rate-limit" | "server" | "unknown";

export interface BusinessError {
  kind: BusinessErrorKind;
  code: string;
  title: string;
  message: string;
  status?: number;
  details: Record<string, unknown>;
  retryable: boolean;
}

const titles: Record<BusinessErrorKind, string> = {
  validation: "Check the information entered",
  authentication: "Your session or credentials need attention",
  authorization: "This action is not permitted",
  conflict: "This change conflicts with existing data",
  "not-found": "The requested record was not found",
  network: "The service could not be reached",
  server: "The service encountered a problem",
  "rate-limit": "Please wait before trying again",
  unknown: "The action could not be completed",
};

function kindFor(status?: number, code?: string): BusinessErrorKind {
  if (!status) return "network";
  if (status === 400 || status === 422 || code === "VALIDATION_FAILED") return "validation";
  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 404) return "not-found";
  if (status === 409 || status === 428) return "conflict";
  if (status === 429) return "rate-limit";
  if (status >= 500) return "server";
  return "unknown";
}

function formatFieldErrors(details: Record<string, unknown>) {
  const fieldErrors = details.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object" || Array.isArray(fieldErrors)) {
    return undefined;
  }
  const entries = Object.entries(fieldErrors).flatMap(([field, message]) => {
    if (typeof message !== "string" || !message.trim()) {
      return [];
    }
    const fieldName = field
      .split(".")
      .pop()!
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/^./, (character) => character.toUpperCase());
    return [`${fieldName}: ${message}`];
  });
  return entries.length ? `Please correct: ${entries.join("; ")}.` : undefined;
}

export function normalizeBusinessError(error: unknown, fallback: string): BusinessError {
  if (typeof error === "string") {
    return { kind: "unknown", code: "ACTION_FAILED", title: titles.unknown, message: fallback, details: {}, retryable: false };
  }
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as { error?: ApiErrorResponse; message?: string } | undefined;
    const apiError = body?.error;
    const kind = kindFor(status, apiError?.code);
    const details = apiError?.details || {};
    const fieldErrorsMessage =
      kind === "validation" && apiError?.code === "VALIDATION_FAILED"
        ? formatFieldErrors(details)
        : undefined;
    const headers = error.response?.headers;
    const header = typeof headers?.get === 'function' ? headers.get('Retry-After') : headers?.['retry-after'] ?? headers?.['Retry-After'];
    const wait = Number(details.retryAfterSeconds ?? (/^\d+$/.test(String(header)) ? header : NaN));
    return {
      kind,
      code: apiError?.code || (status ? `HTTP_${status}` : "NETWORK_ERROR"),
      title: titles[kind],
      message:
        kind === "rate-limit" && Number.isFinite(wait) && wait > 0
          ? `Too many requests. Try again in ${Math.ceil(wait)} seconds.`
          : kind === "server"
          ? (apiError?.code === "SERVICE_UNAVAILABLE" ? apiError.message : fallback)
          : fieldErrorsMessage ||
            apiError?.message ||
            body?.message ||
            (status ? fallback : "Check your connection and try again."),
      status,
      details,
      retryable: kind === "network" || kind === "server" || kind === "rate-limit",
    };
  }
  const kind: BusinessErrorKind = "unknown";
  return { kind, code: "UNKNOWN_ERROR", title: titles[kind], message: fallback, details: {}, retryable: false };
}
