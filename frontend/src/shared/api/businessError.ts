import axios from "axios";
import type { ApiErrorResponse } from "./types";

export type BusinessErrorKind = "validation" | "authentication" | "authorization" | "conflict" | "not-found" | "network" | "server" | "unknown";

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
  unknown: "The action could not be completed",
};

function kindFor(status?: number, code?: string): BusinessErrorKind {
  if (!status) return "network";
  if (status === 400 || status === 422 || code === "VALIDATION_FAILED") return "validation";
  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 404) return "not-found";
  if (status === 409) return "conflict";
  if (status >= 500) return "server";
  return "unknown";
}

export function normalizeBusinessError(error: unknown, fallback: string): BusinessError {
  if (typeof error === "string") {
    return { kind: "unknown", code: "ACTION_FAILED", title: titles.unknown, message: error, details: {}, retryable: false };
  }
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as { error?: ApiErrorResponse; message?: string } | undefined;
    const apiError = body?.error;
    const kind = kindFor(status, apiError?.code);
    return {
      kind,
      code: apiError?.code || (status ? `HTTP_${status}` : "NETWORK_ERROR"),
      title: titles[kind],
      message: apiError?.message || body?.message || (status ? fallback : "Check your connection and try again."),
      status,
      details: apiError?.details || {},
      retryable: kind === "network" || kind === "server",
    };
  }
  const kind: BusinessErrorKind = "unknown";
  return { kind, code: "UNKNOWN_ERROR", title: titles[kind], message: error instanceof Error ? error.message : fallback, details: {}, retryable: false };
}
