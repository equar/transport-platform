import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  billToTypeOptions,
  invoiceStatusOptions,
  paymentMethodOptions,
  paymentStatusOptions,
} from "../../billing/api/billingApi";
import {
  complianceEntityTypeOptions,
  complianceIssueSeverityOptions,
  complianceIssueStatusOptions,
} from "../../compliance/api/complianceApi";
import {
  incidentSeverityOptions,
  incidentStatusOptions,
  incidentTypeOptions,
} from "../../incidents/api/incidentsApi";
import { incidentsApi } from "../../incidents/api/incidentsApi";
import { routeStatusOptions } from "../../routes/api/routesApi";
import { serviceTypeOptions } from "../../rides/api/ridesApi";
import { riderTypeOptions } from "../../riders/api/ridersApi";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  reportsApi,
  reportTypeOptions,
  type CompanyReportResponse,
  type ReportDefinitionRecord,
  type ReportFilters,
  type ReportType,
} from "../api/reportsApi";

type ColumnDefinition = {
  key: string;
  header: string;
  render: (row: Record<string, unknown>) => ReactNode;
};

const driverStatusOptions = [
  "APPLIED",
  "PENDING_REVIEW",
  "DOCUMENT_PENDING",
  "TRAINING_PENDING",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "TERMINATED",
] as const;

const vehicleStatusOptions = [
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
  "OUT_OF_SERVICE",
  "SUSPENDED",
] as const;

const riderStatusOptions = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
  "WAITLISTED",
] as const;

const rideStatusOptions = [
  "DRAFT",
  "REQUESTED",
  "PENDING_REVIEW",
  "SCHEDULED",
  "ASSIGNED",
  "DRIVER_EN_ROUTE",
  "ARRIVED",
  "RIDER_NO_SHOW",
  "PICKED_UP",
  "DROPPED_OFF",
  "COMPLETED",
  "CANCELLED",
  "MISSED",
  "FAILED",
] as const;

const vehicleOwnershipTypeOptions = [
  "COMPANY_OWNED",
  "DRIVER_OWNED",
  "LEASED",
] as const;

const complianceIssueTypeOptions = [
  "MISSING_REQUIRED_DOCUMENT",
  "EXPIRED_DOCUMENT",
  "EXPIRING_SOON",
  "REJECTED_DOCUMENT",
  "UNVERIFIED_DOCUMENT",
  "BLOCKED_FOR_ASSIGNMENT",
  "OTHER",
] as const;

const reportColumns: Record<ReportType, ColumnDefinition[]> = {
  DRIVER: [
    {
      key: "driverCode",
      header: "Driver",
      render: (row) => row.driverCode as ReactNode,
    },
    {
      key: "driverName",
      header: "Name",
      render: (row) => row.driverName as ReactNode,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusChip value={String(row.status)} />,
    },
    {
      key: "driverType",
      header: "Type",
      render: (row) => String(row.driverType ?? "-").replaceAll("_", " "),
    },
    {
      key: "licenseExpiryDate",
      header: "License Expiry",
      render: (row) =>
        row.licenseExpiryDate
          ? formatDateTime(String(row.licenseExpiryDate))
          : "-",
    },
  ],
  VEHICLE: [
    {
      key: "vehicleCode",
      header: "Vehicle",
      render: (row) => row.vehicleCode as ReactNode,
    },
    {
      key: "vehicleName",
      header: "Name",
      render: (row) => row.vehicleName as ReactNode,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusChip value={String(row.status)} />,
    },
    {
      key: "ownershipType",
      header: "Ownership",
      render: (row) => String(row.ownershipType ?? "-").replaceAll("_", " "),
    },
    {
      key: "plateNumber",
      header: "Plate",
      render: (row) => row.plateNumber as ReactNode,
    },
  ],
  RIDER: [
    {
      key: "riderCode",
      header: "Rider",
      render: (row) => row.riderCode as ReactNode,
    },
    {
      key: "riderName",
      header: "Name",
      render: (row) => row.riderName as ReactNode,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusChip value={String(row.status)} />,
    },
    {
      key: "riderType",
      header: "Type",
      render: (row) => String(row.riderType ?? "-").replaceAll("_", " "),
    },
    {
      key: "support",
      header: "Support Needs",
      render: (row) => {
        const needs = [
          row.wheelchairRequired ? "Wheelchair" : null,
          row.escortRequired ? "Escort" : null,
        ].filter(Boolean);
        return needs.join(", ") || "None";
      },
    },
  ],
  RIDE: [
    {
      key: "rideNumber",
      header: "Ride",
      render: (row) => row.rideNumber as ReactNode,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusChip value={String(row.status)} />,
    },
    {
      key: "serviceType",
      header: "Service",
      render: (row) => String(row.serviceType ?? "-").replaceAll("_", " "),
    },
    {
      key: "riderName",
      header: "Rider",
      render: (row) => row.riderName as ReactNode,
    },
    {
      key: "scheduledPickupAt",
      header: "Pickup",
      render: (row) =>
        row.scheduledPickupAt
          ? formatDateTime(String(row.scheduledPickupAt))
          : "-",
    },
  ],
  ROUTE: [
    {
      key: "routeCode",
      header: "Route",
      render: (row) => row.routeCode as ReactNode,
    },
    {
      key: "routeName",
      header: "Name",
      render: (row) => row.routeName as ReactNode,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusChip value={String(row.status)} />,
    },
    {
      key: "serviceType",
      header: "Service",
      render: (row) => String(row.serviceType ?? "-").replaceAll("_", " "),
    },
    {
      key: "routeDate",
      header: "Route Date",
      render: (row) =>
        row.routeDate ? formatDateTime(String(row.routeDate)) : "-",
    },
  ],
  INVOICE: [
    {
      key: "invoiceNumber",
      header: "Invoice",
      render: (row) => row.invoiceNumber as ReactNode,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusChip value={String(row.status)} />,
    },
    {
      key: "billToName",
      header: "Bill To",
      render: (row) => row.billToName as ReactNode,
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (row) =>
        formatCurrency(
          Number(row.totalAmount ?? 0),
          String(row.currency ?? "USD"),
        ),
    },
    {
      key: "balanceDue",
      header: "Balance",
      render: (row) =>
        formatCurrency(
          Number(row.balanceDue ?? 0),
          String(row.currency ?? "USD"),
        ),
    },
  ],
  PAYMENT: [
    {
      key: "paymentNumber",
      header: "Payment",
      render: (row) => row.paymentNumber as ReactNode,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusChip value={String(row.status)} />,
    },
    {
      key: "paymentMethod",
      header: "Method",
      render: (row) => String(row.paymentMethod ?? "-").replaceAll("_", " "),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => formatCurrency(Number(row.amount ?? 0), "USD"),
    },
    {
      key: "invoiceNumber",
      header: "Invoice",
      render: (row) => row.invoiceNumber as ReactNode,
    },
  ],
  COMPLIANCE: [
    {
      key: "entityCode",
      header: "Entity",
      render: (row) => row.entityCode as ReactNode,
    },
    {
      key: "entityNameSummary",
      header: "Name",
      render: (row) => row.entityNameSummary as ReactNode,
    },
    {
      key: "issueType",
      header: "Issue",
      render: (row) => String(row.issueType ?? "-").replaceAll("_", " "),
    },
    {
      key: "severity",
      header: "Severity",
      render: (row) => <StatusChip value={String(row.severity)} />,
    },
    {
      key: "issueStatus",
      header: "Status",
      render: (row) => <StatusChip value={String(row.issueStatus)} />,
    },
  ],
  INCIDENT: [
    {
      key: "incidentCode",
      header: "Incident",
      render: (row) => row.incidentCode as ReactNode,
    },
    { key: "title", header: "Title", render: (row) => row.title as ReactNode },
    {
      key: "severity",
      header: "Severity",
      render: (row) => <StatusChip value={String(row.severity)} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusChip value={String(row.status)} />,
    },
    {
      key: "assignedToName",
      header: "Assigned",
      render: (row) => row.assignedToName as ReactNode,
    },
  ],
};

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function getStatusOptions(reportType: ReportType) {
  switch (reportType) {
    case "DRIVER":
      return driverStatusOptions;
    case "VEHICLE":
      return vehicleStatusOptions;
    case "RIDER":
      return riderStatusOptions;
    case "RIDE":
      return rideStatusOptions;
    case "ROUTE":
      return routeStatusOptions;
    case "INVOICE":
      return invoiceStatusOptions;
    case "PAYMENT":
      return paymentStatusOptions;
    case "COMPLIANCE":
      return complianceIssueStatusOptions;
    case "INCIDENT":
      return incidentStatusOptions;
    default:
      return [] as const;
  }
}

function exportCsv(report: CompanyReportResponse<Record<string, unknown>>) {
  if (report.rows.length === 0) {
    return;
  }

  const headers = Object.keys(report.rows[0]);
  const csv = [headers.join(",")]
    .concat(
      report.rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            const serialized = value == null ? "" : String(value);
            return `"${serialized.replaceAll('"', '""')}"`;
          })
          .join(","),
      ),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report.reportType.toLowerCase()}-report.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function CompanyReportsPage() {
  const { showError, showSuccess } = useToast();
  const [definitions, setDefinitions] = useState<ReportDefinitionRecord[]>([]);
  const [selectedReportType, setSelectedReportType] =
    useState<ReportType>("DRIVER");
  const [referenceData, setReferenceData] = useState<Awaited<
    ReturnType<typeof incidentsApi.getReferenceData>
  > | null>(null);
  const [report, setReport] = useState<CompanyReportResponse<
    Record<string, unknown>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    keyword: "",
    fromDate: "",
    toDate: "",
  });

  const selectedDefinition = useMemo(
    () =>
      definitions.find((item) => item.reportType === selectedReportType) ??
      null,
    [definitions, selectedReportType],
  );

  useEffect(() => {
    async function loadDefinitions() {
      setLoading(true);
      try {
        const [reportDefinitions, refs] = await Promise.all([
          reportsApi.listDefinitions(),
          incidentsApi.getReferenceData(),
        ]);
        setDefinitions(reportDefinitions);
        setReferenceData(refs);
        setSelectedReportType(reportDefinitions[0]?.reportType ?? "DRIVER");
        setError(null);
      } catch {
        setError("Report definitions could not be loaded.");
        showError("Report definitions could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    void loadDefinitions();
  }, [showError]);

  useEffect(() => {
    if (definitions.length === 0) {
      return;
    }

    void runReport(selectedReportType);
  }, [definitions, selectedReportType]);

  async function runReport(reportType: ReportType) {
    setRunning(true);
    setError(null);
    try {
      const response =
        reportType === "DRIVER"
          ? await reportsApi.getDriverReport(filters)
          : reportType === "VEHICLE"
            ? await reportsApi.getVehicleReport(filters)
            : reportType === "RIDER"
              ? await reportsApi.getRiderReport(filters)
              : reportType === "RIDE"
                ? await reportsApi.getRideReport(filters)
                : reportType === "ROUTE"
                  ? await reportsApi.getRouteReport(filters)
                  : reportType === "INVOICE"
                    ? await reportsApi.getInvoiceReport(filters)
                    : reportType === "PAYMENT"
                      ? await reportsApi.getPaymentReport(filters)
                      : reportType === "COMPLIANCE"
                        ? await reportsApi.getComplianceReport(filters)
                        : await reportsApi.getIncidentReport(filters);
      setReport(
        response as unknown as CompanyReportResponse<Record<string, unknown>>,
      );
    } catch {
      setError("The selected report could not be generated.");
      showError("The selected report could not be generated.");
    } finally {
      setRunning(false);
    }
  }

  function updateFilter(
    key: keyof ReportFilters,
    value: string | number | boolean | undefined,
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function supports(filterName: string) {
    return selectedDefinition?.supportedFilters.includes(filterName) ?? false;
  }

  const metrics = report?.summary ?? [];

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Batch 6B"
        title="Company Reports"
        description="Run operational, billing, compliance, and incident reports from a single tenant-admin workspace with export-ready output."
      >
        <Button
          variant="contained"
          startIcon={<PlayArrowRoundedIcon />}
          onClick={() => void runReport(selectedReportType)}
          disabled={running || loading}
        >
          Run Report
        </Button>
      </SectionHeader>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <MetricCard
          icon={<AssessmentRoundedIcon color="primary" />}
          label="Available Reports"
          value={definitions.length}
          caption="Predefined operational and administrative report templates available to this tenant."
        />
        <MetricCard
          icon={<FilterAltRoundedIcon color="primary" />}
          label="Current Rows"
          value={report?.rowCount ?? 0}
          caption="Rows returned by the currently selected report and filters."
        />
        <MetricCard
          icon={<DownloadRoundedIcon color="primary" />}
          label="Export Formats"
          value={(selectedDefinition?.exportFormats ?? []).join(", ") || "-"}
          caption="Formats declared by the backend for future-ready exports."
        />
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack
        direction={{ xs: "column", xl: "row" }}
        spacing={3}
        alignItems="stretch"
      >
        <PageCard sx={{ minWidth: { xl: 320 } }}>
          <Stack spacing={1.5}>
            <Typography variant="h5">Report Catalog</Typography>
            <Typography color="text.secondary">
              Choose a report definition, then refine the filters on the right.
            </Typography>
            {loading ? (
              <LoadingState />
            ) : (
              reportTypeOptions.map((reportType) => {
                const definition = definitions.find(
                  (item) => item.reportType === reportType,
                );
                if (!definition) {
                  return null;
                }

                return (
                  <Button
                    key={reportType}
                    variant={
                      selectedReportType === reportType
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => setSelectedReportType(reportType)}
                    sx={{ justifyContent: "flex-start" }}
                  >
                    {definition.title}
                  </Button>
                );
              })
            )}
          </Stack>
        </PageCard>

        <Stack spacing={3} sx={{ flex: 1 }}>
          <PageCard>
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="h5">
                  {selectedDefinition?.title ?? "Report"}
                </Typography>
                <Typography color="text.secondary">
                  {selectedDefinition?.description ??
                    "Choose a report to inspect its available results."}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {(selectedDefinition?.supportedFilters ?? []).map((filter) => (
                  <Chip
                    key={filter}
                    label={filter}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Stack>
          </PageCard>

          <AdminFilterBar>
            <TextField
              label="Search"
              placeholder="Keyword"
              value={filters.keyword ?? ""}
              onChange={(event) => updateFilter("keyword", event.target.value)}
              fullWidth
            />
            {supports("status") ? (
              <TextField
                select
                label="Status"
                value={filters.status ?? ""}
                onChange={(event) =>
                  updateFilter("status", event.target.value || undefined)
                }
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">All States</MenuItem>
                {getStatusOptions(selectedReportType).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("driverType") ? (
              <TextField
                select
                label="Driver Type"
                value={filters.driverType ?? ""}
                onChange={(event) =>
                  updateFilter("driverType", event.target.value || undefined)
                }
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="EMPLOYEE">EMPLOYEE</MenuItem>
                <MenuItem value="CONTRACTOR">CONTRACTOR</MenuItem>
              </TextField>
            ) : null}
            {supports("ownershipType") ? (
              <TextField
                select
                label="Ownership"
                value={filters.ownershipType ?? ""}
                onChange={(event) =>
                  updateFilter("ownershipType", event.target.value || undefined)
                }
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">All Ownership</MenuItem>
                {vehicleOwnershipTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("serviceType") ? (
              <TextField
                select
                label="Service"
                value={filters.serviceType ?? ""}
                onChange={(event) =>
                  updateFilter("serviceType", event.target.value || undefined)
                }
                sx={{ minWidth: 190 }}
              >
                <MenuItem value="">All Services</MenuItem>
                {serviceTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("riderType") ? (
              <TextField
                select
                label="Rider Type"
                value={filters.riderType ?? ""}
                onChange={(event) =>
                  updateFilter("riderType", event.target.value || undefined)
                }
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">All Types</MenuItem>
                {riderTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("organization") ? (
              <TextField
                select
                label="Organization"
                value={
                  filters.organizationId ? String(filters.organizationId) : ""
                }
                onChange={(event) =>
                  updateFilter(
                    "organizationId",
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Organizations</MenuItem>
                {(referenceData?.organizations ?? []).map((option) => (
                  <MenuItem key={option.id} value={String(option.id)}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("rider") ? (
              <TextField
                select
                label="Rider"
                value={filters.riderId ? String(filters.riderId) : ""}
                onChange={(event) =>
                  updateFilter(
                    "riderId",
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Riders</MenuItem>
                {(referenceData?.riders ?? []).map((option) => (
                  <MenuItem key={option.id} value={String(option.id)}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("driver") ? (
              <TextField
                select
                label="Driver"
                value={filters.driverId ? String(filters.driverId) : ""}
                onChange={(event) =>
                  updateFilter(
                    "driverId",
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Drivers</MenuItem>
                {(referenceData?.drivers ?? []).map((option) => (
                  <MenuItem key={option.id} value={String(option.id)}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("billToType") ? (
              <TextField
                select
                label="Bill To"
                value={filters.billToType ?? ""}
                onChange={(event) =>
                  updateFilter("billToType", event.target.value || undefined)
                }
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">All Parties</MenuItem>
                {billToTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("paymentMethod") ? (
              <TextField
                select
                label="Method"
                value={filters.paymentMethod ?? ""}
                onChange={(event) =>
                  updateFilter("paymentMethod", event.target.value || undefined)
                }
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">All Methods</MenuItem>
                {paymentMethodOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("entityType") ? (
              <TextField
                select
                label="Entity"
                value={filters.entityType ?? ""}
                onChange={(event) =>
                  updateFilter("entityType", event.target.value || undefined)
                }
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">All Entities</MenuItem>
                {complianceEntityTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("issueType") ? (
              <TextField
                select
                label="Issue Type"
                value={filters.issueType ?? ""}
                onChange={(event) =>
                  updateFilter("issueType", event.target.value || undefined)
                }
                sx={{ minWidth: 210 }}
              >
                <MenuItem value="">All Issue Types</MenuItem>
                {complianceIssueTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("severity") ? (
              <TextField
                select
                label="Severity"
                value={filters.severity ?? ""}
                onChange={(event) =>
                  updateFilter("severity", event.target.value || undefined)
                }
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">All Severity</MenuItem>
                {(selectedReportType === "COMPLIANCE"
                  ? complianceIssueSeverityOptions
                  : incidentSeverityOptions
                ).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("incidentType") ? (
              <TextField
                select
                label="Incident Type"
                value={filters.incidentType ?? ""}
                onChange={(event) =>
                  updateFilter("incidentType", event.target.value || undefined)
                }
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="">All Types</MenuItem>
                {incidentTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("assignedTo") ? (
              <TextField
                select
                label="Assigned To"
                value={
                  filters.assignedToUserId
                    ? String(filters.assignedToUserId)
                    : ""
                }
                onChange={(event) =>
                  updateFilter(
                    "assignedToUserId",
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Assignees</MenuItem>
                {(referenceData?.users ?? []).map((option) => (
                  <MenuItem key={option.id} value={String(option.id)}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {supports("overdueOnly") ? (
              <TextField
                select
                label="Overdue"
                value={String(filters.overdueOnly ?? "")}
                onChange={(event) =>
                  updateFilter(
                    "overdueOnly",
                    event.target.value === ""
                      ? undefined
                      : event.target.value === "true",
                  )
                }
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="true">Overdue Only</MenuItem>
              </TextField>
            ) : null}
            <TextField
              label="From"
              type="date"
              value={filters.fromDate ?? ""}
              onChange={(event) =>
                updateFilter("fromDate", event.target.value || undefined)
              }
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="To"
              type="date"
              value={filters.toDate ?? ""}
              onChange={(event) =>
                updateFilter("toDate", event.target.value || undefined)
              }
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
          </AdminFilterBar>

          <PageCard>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
              {metrics.length === 0 ? (
                <Typography color="text.secondary">
                  Run a report to see summary metrics.
                </Typography>
              ) : (
                metrics.map((metric) => (
                  <MetricCard
                    key={metric.key}
                    icon={<AssessmentRoundedIcon color="primary" />}
                    label={metric.label}
                    value={metric.value}
                  />
                ))
              )}
            </Stack>
          </PageCard>

          <PageCard sx={{ p: 0 }}>
            {running ? (
              <LoadingState />
            ) : !report || report.rows.length === 0 ? (
              <EmptyState
                title="No report rows"
                description="Adjust the filters or switch to another report definition to inspect a different slice of tenant data."
              />
            ) : (
              <>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  spacing={2}
                  sx={{ px: 3, pt: 3 }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h5">{report.title}</Typography>
                    <Typography color="text.secondary">
                      Generated {formatDateTime(report.generatedAt)} •{" "}
                      {report.rowCount} rows
                    </Typography>
                  </Stack>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadRoundedIcon />}
                    onClick={() => {
                      exportCsv(report);
                      showSuccess(
                        "CSV export generated from the current report rows.",
                      );
                    }}
                  >
                    Export CSV
                  </Button>
                </Stack>
                <Table>
                  <TableHead>
                    <TableRow>
                      {reportColumns[selectedReportType].map((column) => (
                        <TableCell key={column.key}>{column.header}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.rows.map((row, index) => (
                      <TableRow key={String(row.id ?? index)} hover>
                        {reportColumns[selectedReportType].map((column) => (
                          <TableCell key={column.key}>
                            {column.render(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </PageCard>
        </Stack>
      </Stack>
    </Stack>
  );
}
