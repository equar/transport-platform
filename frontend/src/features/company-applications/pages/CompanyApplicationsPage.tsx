import {
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useEffect, useState } from "react";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import { normalizeBusinessError, type BusinessError } from "../../../shared/api/businessError";
import { BusinessErrorState } from "../../../shared/components/BusinessErrorState";
import { WorkspacePage } from "../../../shared/components/WorkspacePage";
import { DataTableShell } from "../../../shared/components/DataTableShell";
import {
  companyApplicationsApi,
  type CompanyApplication,
  type CompanyApplicationReviewPayload,
} from "../api/companyApplicationsApi";
import { CompanyApplicationDetailsDialog } from "../components/CompanyApplicationDetailsDialog";
import { CompanyApplicationReviewDialog } from "../components/CompanyApplicationReviewDialog";

const applicationStatuses = [
  "",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
];

export function CompanyApplicationsPage() {
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<CompanyApplication[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BusinessError | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<CompanyApplication | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<
    "under-review" | "approve" | "reject" | null
  >(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [applicationLoadingId, setApplicationLoadingId] = useState<number | null>(null);

  async function loadApplications() {
    setLoading(true);
    setError(null);
    try {
      const response = await companyApplicationsApi.search({
        keyword,
        status,
        page,
        size,
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch (loadError) {
      setError(normalizeBusinessError(loadError, "Company applications could not be loaded."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, [keyword, page, size, status]);

  async function refreshSelected(applicationId: number) {
    const refreshed = await companyApplicationsApi.getById(applicationId);
    setSelectedApplication(refreshed);
  }

  async function openApplication(
    applicationId: number,
    destination: "details" | "under-review" | "approve" | "reject",
  ) {
    setApplicationLoadingId(applicationId);
    try {
      const application = await companyApplicationsApi.getById(applicationId);
      setSelectedApplication(application);
      if (destination === "details") {
        setDetailsOpen(true);
      } else {
        setReviewMode(destination);
      }
    } catch (openError) {
      showError(openError, "The application details could not be loaded.");
    } finally {
      setApplicationLoadingId(null);
    }
  }

  async function handleReviewSubmit(payload: CompanyApplicationReviewPayload) {
    if (!selectedApplication || !reviewMode) {
      return;
    }

    setReviewLoading(true);
    try {
      if (reviewMode === "under-review") {
        await companyApplicationsApi.moveToUnderReview(
          selectedApplication.id,
          payload,
        );
        showSuccess("Application moved to review successfully.");
      } else if (reviewMode === "approve") {
        await companyApplicationsApi.approve(selectedApplication.id, payload);
        showSuccess(
          "Application approved and onboarding setup created successfully.",
        );
      } else {
        await companyApplicationsApi.reject(selectedApplication.id, payload);
        showSuccess("Application rejected successfully.");
      }
      setReviewMode(null);
      await loadApplications();
      await refreshSelected(selectedApplication.id);
    } catch (reviewError) {
      showError(reviewError, "The review action could not be completed.");
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <WorkspacePage
        eyebrow="Platform Administration"
        title="Company Applications"
        description="Review inbound transportation company applications, capture decisions, and trigger tenant onboarding when an application is approved."
      >

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by company name, email, phone, or application number"
          value={keyword}
          onChange={(event) => {
            setPage(0);
            setKeyword(event.target.value);
          }}
        />
        <TextField
          label="Status"
          select
          value={status}
          onChange={(event) => {
            setPage(0);
            setStatus(event.target.value);
          }}
          sx={{ maxWidth: 220 }}
        >
          {applicationStatuses.map((option) => (
            <MenuItem key={option || "all"} value={option}>
              {option || "All statuses"}
            </MenuItem>
          ))}
        </TextField>
      </AdminFilterBar>

      {error ? <BusinessErrorState error={error} onRetry={() => void loadApplications()} /> : null}

      <DataTableShell
        loading={loading}
        empty={items.length === 0}
        emptyTitle="No applications found"
        emptyDescription="Adjust the filters or wait for new company applications to be submitted."
        pagination={<TablePagination
          component="div" count={total} page={page} rowsPerPage={size}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => { setSize(Number(event.target.value)); setPage(0); }}
        />}
      >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Application Number</TableCell>
                    <TableCell>Legal Company Name</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Business Type</TableCell>
                    <TableCell>Fleet</TableCell>
                    <TableCell>Drivers</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((application) => (
                    <TableRow key={application.id} hover>
                      <TableCell>{application.applicationNumber}</TableCell>
                      <TableCell>{application.legalCompanyName}</TableCell>
                      <TableCell>
                        {application.contactFirstName}{" "}
                        {application.contactLastName}
                      </TableCell>
                      <TableCell>{application.email}</TableCell>
                      <TableCell>{application.phone}</TableCell>
                      <TableCell>{application.businessType}</TableCell>
                      <TableCell>{application.fleetSize ?? 0}</TableCell>
                      <TableCell>{application.numberOfDrivers ?? 0}</TableCell>
                      <TableCell>
                        <StatusChip value={application.status} />
                      </TableCell>
                      <TableCell>
                        {formatDateTime(application.createdAt)}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(application.updatedAt)}
                      </TableCell>
                      <TableCell align="right">
                        <TableActionButton
                          title="View details"
                          buttonProps={{ disabled: applicationLoadingId === application.id }}
                          onClick={() => void openApplication(application.id, "details")}
                        >
                          <VisibilityRoundedIcon />
                        </TableActionButton>
                        {application.status === "SUBMITTED" ? (
                          <TableActionButton
                            title="Review application"
                            buttonProps={{ disabled: applicationLoadingId === application.id }}
                            onClick={() => void openApplication(application.id, "under-review")}
                          >
                            <ChecklistRoundedIcon />
                          </TableActionButton>
                        ) : null}
                        {["SUBMITTED", "UNDER_REVIEW"].includes(
                          application.status,
                        ) ? (
                          <>
                            <TableActionButton
                              title="Approve application"
                              buttonProps={{ disabled: applicationLoadingId === application.id }}
                              onClick={() => void openApplication(application.id, "approve")}
                            >
                              <CheckCircleRoundedIcon />
                            </TableActionButton>
                            <TableActionButton
                              title="Reject application"
                              buttonProps={{ disabled: applicationLoadingId === application.id }}
                              onClick={() => void openApplication(application.id, "reject")}
                            >
                              <CloseRoundedIcon />
                            </TableActionButton>
                          </>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
      </DataTableShell>

      <CompanyApplicationDetailsDialog
        open={detailsOpen}
        application={selectedApplication}
        onClose={() => setDetailsOpen(false)}
      />
      <CompanyApplicationReviewDialog
        open={Boolean(reviewMode)}
        mode={reviewMode ?? "approve"}
        application={selectedApplication}
        loading={reviewLoading}
        onClose={() => setReviewMode(null)}
        onSubmit={handleReviewSubmit}
      />
    </WorkspacePage>
  );
}
