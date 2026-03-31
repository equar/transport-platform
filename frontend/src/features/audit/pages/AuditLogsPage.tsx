import { useEffect, useState } from "react";
import {
  Alert,
  MenuItem,
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
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { formatDateTime } from "../../../shared/utils/format";
import { AuditLogDetailsDialog } from "../components/AuditLogDetailsDialog";
import { auditLogsApi, type AuditLogRecord } from "../api/auditLogsApi";

const moduleOptions = ["", "TENANT", "USER", "ROLE", "COMPANY_APPLICATION"];
const actionOptions = [
  "",
  "CREATED",
  "UPDATED",
  "ACTIVATED",
  "SUSPENDED",
  "STATUS_CHANGED",
  "ASSIGNMENT_CHANGED",
  "SUBMITTED",
  "REVIEWED",
  "APPROVED",
  "REJECTED",
];

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function AuditLogsPage() {
  const { session } = useAuth();
  const platformAdmin = isPlatformAdmin(session);
  const [items, setItems] = useState<AuditLogRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AuditLogRecord | null>(
    null,
  );

  useEffect(() => {
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
        setItems(response.items);
        setTotal(response.totalElements);
      })
      .catch(() => {
        setError("Audit log records could not be loaded.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [keyword, module, action, createdFrom, createdTo, page, size]);

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
            : "Review tenant-scoped administrative activity for users, roles, and onboarding changes relevant to your company."
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
        <TextField
          label="Module"
          select
          value={module}
          onChange={(event) => {
            setPage(0);
            setModule(event.target.value);
          }}
          sx={{ minWidth: 180 }}
        >
          {moduleOptions.map((option) => (
            <MenuItem key={option || "all-modules"} value={option}>
              {option ? formatLabel(option) : "All modules"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Action"
          select
          value={action}
          onChange={(event) => {
            setPage(0);
            setAction(event.target.value);
          }}
          sx={{ minWidth: 200 }}
        >
          {actionOptions.map((option) => (
            <MenuItem key={option || "all-actions"} value={option}>
              {option ? formatLabel(option) : "All actions"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="From"
          type="date"
          value={createdFrom}
          onChange={(event) => {
            setPage(0);
            setCreatedFrom(event.target.value);
          }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To"
          type="date"
          value={createdTo}
          onChange={(event) => {
            setPage(0);
            setCreatedTo(event.target.value);
          }}
          InputLabelProps={{ shrink: true }}
        />
      </AdminFilterBar>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        {loading ? (
          <LoadingState />
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
                      <TableCell>{formatLabel(item.module)}</TableCell>
                      <TableCell>{formatLabel(item.action)}</TableCell>
                      <TableCell>
                        {formatLabel(item.entityType)} #{item.entityId}
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
