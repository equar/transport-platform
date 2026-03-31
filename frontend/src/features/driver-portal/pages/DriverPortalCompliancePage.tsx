import {
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  driverPortalApi,
  type DriverPortalComplianceSummaryRecord,
} from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { formatDateTime } from "../../../shared/utils/format";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function DriverPortalCompliancePage() {
  const [summary, setSummary] =
    useState<DriverPortalComplianceSummaryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await driverPortalApi.getComplianceSummary();
        if (!cancelled) {
          setSummary(response);
        }
      } catch {
        if (!cancelled) {
          setError("Driver compliance summary could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Compliance"
        description="Review document status, upcoming expirations, and issues that still need action."
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {summary ? (
        <>
          <PageCard>
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Typography variant="h6">
                Unresolved Issues: {summary.unresolvedComplianceIssues}
              </Typography>
              <Typography variant="h6">
                Expiring Soon: {summary.expiringDocumentsSoon}
              </Typography>
            </Stack>
          </PageCard>
          <PageCard>
            <Stack spacing={2}>
              <Typography variant="h5">Compliance Issues</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Summary</TableCell>
                    <TableCell>Recommended Action</TableCell>
                    <TableCell>Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.issues.map((issue) => (
                    <TableRow key={issue.id} hover>
                      <TableCell>{issue.issueType}</TableCell>
                      <TableCell>{issue.severity}</TableCell>
                      <TableCell>
                        <StatusChip value={issue.issueStatus} />
                      </TableCell>
                      <TableCell>{issue.summary}</TableCell>
                      <TableCell>{issue.recommendedAction ?? "-"}</TableCell>
                      <TableCell>{formatDateTime(issue.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          </PageCard>
          <PageCard>
            <Stack spacing={2}>
              <Typography variant="h5">Documents</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    <TableCell>Verification</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Expiry</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.documents.map((document) => (
                    <TableRow key={document.id} hover>
                      <TableCell>{document.documentType}</TableCell>
                      <TableCell>
                        <StatusChip value={document.verificationStatus} />
                      </TableCell>
                      <TableCell>
                        <StatusChip value={document.status} />
                      </TableCell>
                      <TableCell>{formatDate(document.expiryDate)}</TableCell>
                      <TableCell>{document.notes ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          </PageCard>
        </>
      ) : null}
    </Stack>
  );
}
