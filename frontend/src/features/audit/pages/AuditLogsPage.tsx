import { useEffect, useState } from "react";
import {
  Button,
  Autocomplete,
  Alert,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { isPlatformAdmin } from "../../auth/access";
import { useAuth } from "../../auth/context/AuthContext";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { formatStatusLabel } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { formatDateTime } from "../../../shared/utils/format";
import { AuditLogDetailsDialog } from "../components/AuditLogDetailsDialog";
import { auditLogsApi, type AuditLogRecord } from "../api/auditLogsApi";
import { getApiErrorMessage } from "../../../shared/api/client";

const moduleOptions = [
  "",
  "TENANT",
  "USER",
  "ROLE",
  "COMPANY_APPLICATION",
  "RIDER",
  "GUARDIAN",
  "RIDER_GUARDIAN",
  "DRIVER",
  "DRIVER_DOCUMENT",
  "VEHICLE",
  "VEHICLE_DOCUMENT",
  "RIDE",
  "RECURRING_RIDE",
  "ROUTE",
  "ROUTE_STOP",
  "DRIVER_PORTAL",
  "DRIVER_EARNINGS",
  "ORGANIZATION",
  "ORGANIZATION_CONTACT",
  "CONTRACT",
  "SERVICE_AREA",
  "COMPLIANCE",
  "INCIDENT",
  "INVOICE",
  "PAYMENT",
  "PRICING_RULE",
  "RECEIVABLES",
  "NOTIFICATION",
  "NOTIFICATION_TEMPLATE",
  "REPORT",
  "SETTINGS",
  "AUTH",
  "ORGANIZATION_PORTAL",
  "SAAS_FEATURE_FLAG",
  "SAAS_SUBSCRIPTION_PLAN",
  "SAAS_TENANT_SUBSCRIPTION",
];
const actionOptions = [
  "",
  "CREATED",
  "UPDATED",
  "ACTIVATED",
  "SUSPENDED",
  "DEACTIVATED",
  "WAITLISTED",
  "TERMINATED",
  "MAINTENANCE_MARKED",
  "OUT_OF_SERVICE_MARKED",
  "STATUS_CHANGED",
  "ASSIGNMENT_CHANGED",
  "SUBMITTED",
  "REVIEWED",
  "DOCUMENTS_READY",
  "APPROVED",
  "REJECTED",
  "VERIFIED",
  "LINKED",
  "UNLINKED",
  "ARCHIVED",
  "DOCUMENT_SUBMITTED",
  "PROFILE_UPDATED",
  "COLLECTION_NOTE_ADDED",
  "GENERATED",
  "MARKED_ALL_READ",
  "OVERRIDE_UPDATED",
  "RATE_UPDATED",
  "RETURN_LEG_CREATED",
  "RUN",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET_BY_ADMIN",
  "PASSWORD_RESET_COMPLETED",
  "PASSWORD_RESET_REQUESTED",
  "TENANT_OWNER_SETUP_COMPLETED",
  "THEME_APPLIED",
];

export function AuditLogsPage() {
  const { session } = useAuth();
  const platformAdmin = isPlatformAdmin(session);
  const [items, setItems] = useState<AuditLogRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AuditLogRecord | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    auditLogsApi
      .search({
        keyword,
        module,
        action,
        createdFrom,
        createdTo,
        page,
        size,
      })
      .then((response) => {
        if (!active) return;
        setItems(response.items);
        setTotal(response.totalElements);
      })
      .catch((_caughtError) => {
        if (!active) return;
        setItems([]);
        setTotal(0);
        setError(
          getApiErrorMessage(
            _caughtError,
            "Audit log records could not be loaded.",
          ),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [keyword, module, action, createdFrom, createdTo, page, size, retry]);

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow={
          platformAdmin ? "Platform Administration" : "Company Administration"
        }
        title="Audit Logs"
        description={
          platformAdmin
            ? "Review cross-platform administrative activity for tenants, users, roles, and company application actions."
            : "Review tenant-scoped operational, financial, relationship and administrative history across your company."
        }
      />

      <AdminFilterBar>
        <TextField
          label="Search by keyword"
          value={keyword}
          onChange={(event) => {
            setPage(0);
            setKeyword(event.target.value);
          }}
        />
        <Autocomplete
          freeSolo
          options={moduleOptions.filter(Boolean)}
          inputValue={module}
          onInputChange={(_, value) => {
            setPage(0);
            setModule(value);
          }}
          sx={{ minWidth: 200 }}
          renderInput={(params) => (
            <TextField {...params} label="Module" placeholder="All modules" />
          )}
        />
        <Autocomplete
          freeSolo
          options={actionOptions.filter(Boolean)}
          inputValue={action}
          onInputChange={(_, value) => {
            setPage(0);
            setAction(value);
          }}
          sx={{ minWidth: 200 }}
          renderInput={(params) => (
            <TextField {...params} label="Action" placeholder="All actions" />
          )}
        />
        <TextField
          label="From (UTC)"
          type="date"
          value={createdFrom}
          onChange={(event) => {
            setPage(0);
            setCreatedFrom(event.target.value);
          }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To (UTC)"
          type="date"
          value={createdTo}
          onChange={(event) => {
            setPage(0);
            setCreatedTo(event.target.value);
          }}
          InputLabelProps={{ shrink: true }}
        />
      </AdminFilterBar>

      {error ? (
        <Alert
          severity="error"
          action={
            <Button onClick={() => setRetry((value) => value + 1)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <EmptyState
            title="History unavailable"
            description="Retry loading the audit records."
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No records found"
            description="Adjust the filters or wait for new administrative activity to be recorded."
          />
        ) : (
          <>
            <Paper sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Created At</TableCell>
                    <TableCell>Actor</TableCell>
                    {platformAdmin ? <TableCell>Tenant</TableCell> : null}
                    <TableCell>Module</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Entity</TableCell>
                    <TableCell>Summary</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.actorName || item.actorEmail || "System"}
                        </Typography>
                        {item.actorEmail ? (
                          <Typography variant="caption" color="text.secondary">
                            {item.actorEmail}
                          </Typography>
                        ) : null}
                      </TableCell>
                      {platformAdmin ? (
                        <TableCell>{item.tenantId ?? "Platform"}</TableCell>
                      ) : null}
                      <TableCell>{formatStatusLabel(item.module)}</TableCell>
                      <TableCell>{formatStatusLabel(item.action)}</TableCell>
                      <TableCell>
                        {formatStatusLabel(item.entityType)} #{item.entityId}
                      </TableCell>
                      <TableCell>{item.summary}</TableCell>
                      <TableCell align="right">
                        <TableActionButton
                          title="View Details"
                          onClick={() => setSelectedRecord(item)}
                        >
                          <VisibilityRoundedIcon />
                        </TableActionButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            <TablePagination
              component="div"
              count={total}
              page={page}
              rowsPerPage={size}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              onRowsPerPageChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
            />
          </>
        )}
      </PageCard>

      <AuditLogDetailsDialog
        open={Boolean(selectedRecord)}
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </Stack>
  );
}
