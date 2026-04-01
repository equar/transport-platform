import { Alert, Box, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import {
  driverPortalApi,
  type DriverPortalComplianceSummaryRecord,
} from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
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
    <Stack spacing={2.5}>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">My Compliance</Typography>
          <Typography color="text.secondary">
            Review your document status, expiring items, and compliance issues
            that still need attention.
          </Typography>
        </Stack>
      </PageCard>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {summary ? (
        <>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            <PageCard sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="overline" color="secondary.main">
                Open issues
              </Typography>
              <Typography variant="h4">
                {summary.unresolvedComplianceIssues}
              </Typography>
            </PageCard>
            <PageCard sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="overline" color="secondary.main">
                Expiring soon
              </Typography>
              <Typography variant="h4">
                {summary.expiringDocumentsSoon}
              </Typography>
            </PageCard>
          </Box>
          <PageCard>
            <Stack spacing={2}>
              <Typography variant="h5">Compliance Issues</Typography>
              {summary.issues.length === 0 ? (
                <Typography color="text.secondary">
                  No compliance issues are open right now.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {summary.issues.map((issue) => (
                    <PageCard key={issue.id} sx={{ p: { xs: 2, md: 2.5 } }}>
                      <Stack spacing={1.25}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Typography variant="h6">
                            {issue.issueType}
                          </Typography>
                          <StatusChip value={issue.issueStatus} />
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip
                            label={`Severity: ${issue.severity}`}
                            size="small"
                          />
                          {issue.relatedDocumentType ? (
                            <Chip
                              label={issue.relatedDocumentType}
                              size="small"
                            />
                          ) : null}
                        </Stack>
                        <Typography color="text.secondary">
                          {issue.summary}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Recommended action:{" "}
                          {issue.recommendedAction ?? "Not provided"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Updated: {formatDateTime(issue.updatedAt)}
                        </Typography>
                      </Stack>
                    </PageCard>
                  ))}
                </Stack>
              )}
            </Stack>
          </PageCard>
          <PageCard>
            <Stack spacing={2}>
              <Typography variant="h5">Documents</Typography>
              {summary.documents.length === 0 ? (
                <Typography color="text.secondary">
                  No documents are available.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {summary.documents.map((document) => (
                    <PageCard key={document.id} sx={{ p: { xs: 2, md: 2.5 } }}>
                      <Stack spacing={1.25}>
                        <Typography variant="h6">
                          {document.documentType}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <StatusChip value={document.verificationStatus} />
                          <StatusChip value={document.status} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          File: {document.fileName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Expiry: {formatDate(document.expiryDate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Notes: {document.notes ?? "None"}
                        </Typography>
                      </Stack>
                    </PageCard>
                  ))}
                </Stack>
              )}
            </Stack>
          </PageCard>
        </>
      ) : null}
    </Stack>
  );
}
