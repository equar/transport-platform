import { Chip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

interface StatusChipProps {
  value: string;
  size?: "small" | "medium";
  sx?: SxProps<Theme>;
}

export function formatStatusLabel(value: string) {
  if (value.toUpperCase() === "INVITED") {
    return "Pending";
  }

  if (["NEMT", "SMS", "ACH"].includes(value.toUpperCase())) {
    return value.toUpperCase();
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
      "PAID",
      "ISSUED",
      "APPLIED",
    ].includes(normalized)
  ) {
    return "success";
  }
  if (
    [
      "COMPANY_OWNED",
      "DRIVER_OWNED",
      "LEASED",
      "STUDENT",
      "ELDERLY",
      "NEMT",
      "PRIVATE_PAY",
      "EMPLOYEE_COMMUTER",
      "GASOLINE",
      "DIESEL",
      "HYBRID",
      "ELECTRIC",
      "PROPANE",
      "PHONE",
      "SMS",
      "EMAIL",
      "REMINDER_NOTE",
      "CHECK",
      "BANK_TRANSFER",
      "ACH",
      "CARD",
      "ZELLE",
      "CASH_APP",
      "VENMO",
      "PARENT",
      "SPOUSE",
      "CHILD",
      "SIBLING",
      "CAREGIVER",
      "FACILITY_COORDINATOR",
      "AUTHORIZED_FOR_PICKUP",
      "BILLING_CONTACT",
      "WHEELCHAIR",
      "FLAT_RATE",
      "PER_TRIP",
      "PER_WEEK",
      "PER_MONTH",
      "PER_ROUTE",
      "PER_RIDER",
      "CUSTOM",
      "RIDER",
      "GUARDIAN",
      "ORGANIZATION",
      "CONTRACT",
      "MANUAL",
      "RECURRING_SERVICE",
      "OTHER",
      "CURRENT",
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
      "WAITLISTED",
      "ACTION_REQUIRED",
      "IN_PROGRESS",
      "EMPLOYEE",
      "CONTRACTOR",
      "MAINTENANCE",
      "ESCORT_REQUIRED",
      "DRAFT",
      "PARTIALLY_PAID",
      "OVERDUE",
      "RECORDED",
      "PARTIALLY_APPLIED",
      "DAYS_1_TO_30",
      "DAYS_31_TO_60",
      "DAYS_61_TO_90",
      "DAYS_90_PLUS",
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
      "VOID",
    ].includes(normalized)
  ) {
    return "error";
  }
  return "default";
}

export function StatusChip({ value, size = "small", sx }: StatusChipProps) {
  return (
    <Chip
      label={formatStatusLabel(value)}
      color={resolveColor(value)}
      variant="outlined"
      size={size}
      sx={sx}
    />
  );
}
