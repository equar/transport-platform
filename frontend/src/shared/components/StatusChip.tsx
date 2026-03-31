import { Chip } from "@mui/material";

interface StatusChipProps {
  value: string;
}

function formatStatusLabel(value: string) {
  if (value.toUpperCase() === "INVITED") {
    return "Pending";
  }
  return value.replaceAll("_", " ");
}

function resolveColor(
  value: string,
): "default" | "primary" | "secondary" | "success" | "warning" | "error" {
  const normalized = value.toUpperCase();
  if (
    [
      "ACTIVE",
      "APPROVED",
      "VERIFIED",
      "COMPLIANT",
      "CLEAR",
      "COMPLETED",
    ].includes(normalized)
  ) {
    return "success";
  }
  if (
    [
      "COMPANY_OWNED",
      "DRIVER_OWNED",
      "LEASED",
      "GASOLINE",
      "DIESEL",
      "HYBRID",
      "ELECTRIC",
      "PROPANE",
      "OTHER",
    ].includes(normalized)
  ) {
    return "secondary";
  }
  if (
    [
      "PENDING",
      "SUBMITTED",
      "UNDER_REVIEW",
      "ONBOARDING",
      "INVITED",
      "APPLIED",
      "PENDING_REVIEW",
      "DOCUMENT_PENDING",
      "TRAINING_PENDING",
      "ACTION_REQUIRED",
      "IN_PROGRESS",
      "EMPLOYEE",
      "CONTRACTOR",
      "MAINTENANCE",
    ].includes(normalized)
  ) {
    return "warning";
  }
  if (
    [
      "REJECTED",
      "SUSPENDED",
      "INACTIVE",
      "DEACTIVATED",
      "TERMINATED",
      "EXPIRED",
      "FAILED",
      "NON_COMPLIANT",
      "ARCHIVED",
      "OUT_OF_SERVICE",
    ].includes(normalized)
  ) {
    return "error";
  }
  return "default";
}

export function StatusChip({ value }: StatusChipProps) {
  return (
    <Chip
      label={formatStatusLabel(value)}
      color={resolveColor(value)}
      variant="outlined"
      size="small"
    />
  );
}
