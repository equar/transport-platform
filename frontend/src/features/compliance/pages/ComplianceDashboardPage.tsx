import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import GppBadRoundedIcon from "@mui/icons-material/GppBadRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  Alert,
  Button,
  Drawer,
  MenuItem,
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
import { useEffect, useState } from "react";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  complianceApi,
  complianceEntityTypeOptions,
  complianceIssueSeverityOptions,
  complianceIssueStatusOptions,
  type ComplianceDashboardSummaryRecord,
  type ComplianceEntityType,
  type ComplianceIssueDetailRecord,
  type ComplianceIssueSeverity,
  type ComplianceIssueStatus,
  type ComplianceIssueSummaryRecord,
} from "../api/complianceApi";

export function ComplianceDashboardPage() {
  const { showError, showSuccess } = useToast();
  const [summary, setSummary] =
    useState<ComplianceDashboardSummaryRecord | null>(null);
  const [items, setItems] = useState<ComplianceIssueSummaryRecord[]>([]);
  const [selectedIssue, setSelectedIssue] =
    useState<ComplianceIssueDetailRecord | null>(null);
  const [keyword, setKeyword] = useState("");
  const [entityType, setEntityType] = useState<ComplianceEntityType | "">("");
  const [severity, setSeverity] = useState<ComplianceIssueSeverity | "">("");
  const [issueStatus, setIssueStatus] = useState<ComplianceIssueStatus | "">(
    "",
  );
  const [expiredOnly, setExpiredOnly] = useState("");
  const [expiringSoonOnly, setExpiringSoonOnly] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCompliance() {
    setLoading(true);
    setError(null);
    try {
      const [summaryResponse, issuesResponse] = await Promise.all([
        complianceApi.getSummary(),
        complianceApi.searchIssues({
          keyword,
          entityType,
          severity,
          issueStatus,
          expiredOnly: expiredOnly === "true" ? true : undefined,
          expiringSoonOnly: expiringSoonOnly === "true" ? true : undefined,
          page,
          size,
          sortBy: "updatedAt",
          sortDirection: "DESC",
        }),
      ]);
      setSummary(summaryResponse);
      setItems(issuesResponse.items);
      setTotal(issuesResponse.totalElements);
    } catch {
      setError("Compliance data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCompliance();
  }, [
    entityType,
    expiringSoonOnly,
    expiredOnly,
    issueStatus,
    keyword,
    page,
    severity,
    size,
  ]);

  async function handleOpen(issueId: number) {
    try {
      const response = await complianceApi.getIssue(issueId);
      setSelectedIssue(response);
    } catch {
      showError("Compliance issue details could not be loaded.");
    }
  }

  async function handleAction(action: "acknowledge" | "resolve" | "dismiss") {
    if (!selectedIssue) {
      return;
    }
    try {
      const response =
        action === "acknowledge"
          ? await complianceApi.acknowledgeIssue(selectedIssue.id)
          : action === "resolve"
            ? await complianceApi.resolveIssue(selectedIssue.id)
            : await complianceApi.dismissIssue(selectedIssue.id);
      setSelectedIssue(response);
      showSuccess(`Compliance issue ${action}d successfully.`);
      await loadCompliance();
    } catch {
      showError("Compliance issue could not be updated.");
    }
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Batch 6A"
        title="Compliance Center"
        description="Monitor open fleet and driver compliance issues, spot expiring documents before they block dispatch, and track operator actions on each issue."
      />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <MetricCard
          icon={<ReportProblemRoundedIcon color="primary" />}
          label="Open Issues"
          value={summary?.openComplianceIssues ?? 0}
          caption="Open and acknowledged issues still active in the derived compliance set."
        />
        <MetricCard
          icon={<GppBadRoundedIcon color="primary" />}
          label="Critical Issues"
          value={summary?.criticalComplianceIssues ?? 0}
          caption="Highest-severity issues that threaten assignment readiness."
        />
        <MetricCard
          icon={<CheckCircleRoundedIcon color="primary" />}
          label="Expiring Soon"
          value={summary?.documentsExpiringSoon ?? 0}
          caption="Documents still valid now but approaching expiry inside the alert window."
        />
      </Stack>

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by entity code, name, or document"
          value={keyword}
          onChange={(event) => {
            setPage(0);
            setKeyword(event.target.value);
          }}
          fullWidth
        />
        <TextField
          select
          label="Entity"
          value={entityType}
          onChange={(event) => {
            setPage(0);
            setEntityType(event.target.value as ComplianceEntityType | "");
          }}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">All Entities</MenuItem>
          {complianceEntityTypeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Severity"
          value={severity}
          onChange={(event) => {
            setPage(0);
            setSeverity(event.target.value as ComplianceIssueSeverity | "");
          }}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">All Severity</MenuItem>
          {complianceIssueSeverityOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Issue Status"
          value={issueStatus}
          onChange={(event) => {
            setPage(0);
            setIssueStatus(event.target.value as ComplianceIssueStatus | "");
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All States</MenuItem>
          {complianceIssueStatusOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Expired Only"
          value={expiredOnly}
          onChange={(event) => {
            setPage(0);
            setExpiredOnly(event.target.value);
          }}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Any</MenuItem>
          <MenuItem value="true">Expired</MenuItem>
        </TextField>
        <TextField
          select
          label="Expiring Soon"
          value={expiringSoonOnly}
          onChange={(event) => {
            setPage(0);
            setExpiringSoonOnly(event.target.value);
          }}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Any</MenuItem>
          <MenuItem value="true">Expiring Soon</MenuItem>
        </TextField>
      </AdminFilterBar>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <PageCard sx={{ p: 0 }}>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState
            title="No compliance issues found"
            description="Derived driver and vehicle issues will appear here as documents expire, go missing, or fail review."
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Entity</TableCell>
                  <TableCell>Issue</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Expiry</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={700}>
                          {item.entityCode}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.entityNameSummary}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography>
                          {item.issueType.replaceAll("_", " ")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.summary}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <StatusChip value={item.severity} />
                    </TableCell>
                    <TableCell>
                      <StatusChip value={item.issueStatus} />
                    </TableCell>
                    <TableCell>{item.expiryDate ?? "-"}</TableCell>
                    <TableCell>
                      {item.updatedAt ? formatDateTime(item.updatedAt) : "-"}
                    </TableCell>
                    <TableCell align="right">
                      <TableActionButton
                        title="View"
                        onClick={() => void handleOpen(item.id)}
                      >
                        <VisibilityRoundedIcon />
                      </TableActionButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              rowsPerPage={size}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              onRowsPerPageChange={(event) => {
                setPage(0);
                setSize(Number(event.target.value));
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </PageCard>

      <Drawer
        anchor="right"
        open={Boolean(selectedIssue)}
        onClose={() => setSelectedIssue(null)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 460 }, p: 3 } }}
      >
        {selectedIssue ? (
          <Stack spacing={2.5}>
            <Typography variant="h4">{selectedIssue.entityCode}</Typography>
            <StatusChip value={selectedIssue.issueStatus} />
            <Typography>{selectedIssue.summary}</Typography>
            <Typography variant="body2" color="text.secondary">
              Severity: {selectedIssue.severity}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Issue Type: {selectedIssue.issueType.replaceAll("_", " ")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Related Document: {selectedIssue.relatedDocumentType ?? "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recommended Action: {selectedIssue.recommendedAction ?? "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Source Key: {selectedIssue.sourceKey}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                onClick={() => void handleAction("acknowledge")}
                disabled={selectedIssue.issueStatus !== "OPEN"}
              >
                Acknowledge
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => void handleAction("resolve")}
                disabled={
                  selectedIssue.issueStatus === "RESOLVED" ||
                  selectedIssue.issueStatus === "DISMISSED"
                }
              >
                Resolve
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => void handleAction("dismiss")}
                disabled={
                  selectedIssue.issueStatus === "RESOLVED" ||
                  selectedIssue.issueStatus === "DISMISSED"
                }
              >
                Dismiss
              </Button>
            </Stack>
          </Stack>
        ) : null}
      </Drawer>
    </Stack>
  );
}
