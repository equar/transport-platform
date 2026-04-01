import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  notificationApi,
  notificationChannelOptions,
  notificationTemplateStatusOptions,
  notificationTypeOptions,
  type NotificationChannel,
  type NotificationTemplatePayload,
  type NotificationTemplateRecord,
  type NotificationTemplateStatus,
  type NotificationType,
} from "../api/notificationApi";

const emptyPayload: NotificationTemplatePayload = {
  name: "",
  eventType: "COMPANY_USER_CREATED",
  channel: "IN_APP",
  titleTemplate: "",
  subjectTemplate: "",
  bodyTemplate: "",
  description: "",
  isDefault: false,
};

export function NotificationTemplateManagementPage() {
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<NotificationTemplateRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<NotificationTemplateStatus | "">("");
  const [channel, setChannel] = useState<NotificationChannel | "">("");
  const [eventType, setEventType] = useState<NotificationType | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<NotificationTemplateRecord | null>(null);
  const [form, setForm] = useState<NotificationTemplatePayload>(emptyPayload);

  async function loadTemplates() {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationApi.searchTemplates({
        keyword,
        status,
        channel,
        eventType,
        page,
        size,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Notification templates could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, [channel, eventType, keyword, page, size, status]);

  function openCreateDialog() {
    setSelectedTemplate(null);
    setForm(emptyPayload);
    setDialogOpen(true);
  }

  function openEditDialog(template: NotificationTemplateRecord) {
    setSelectedTemplate(template);
    setForm({
      name: template.name,
      eventType: template.eventType,
      channel: template.channel,
      subjectTemplate: template.subjectTemplate,
      titleTemplate: template.titleTemplate,
      bodyTemplate: template.bodyTemplate,
      description: template.description,
      isDefault: template.isDefault,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      if (selectedTemplate) {
        await notificationApi.updateTemplate(selectedTemplate.id, form);
        showSuccess("Notification template updated successfully.");
      } else {
        await notificationApi.createTemplate(form);
        showSuccess("Notification template created successfully.");
      }
      setDialogOpen(false);
      await loadTemplates();
    } catch {
      showError("Notification template changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(template: NotificationTemplateRecord) {
    try {
      if (template.status === "ACTIVE") {
        await notificationApi.deactivateTemplate(template.id);
        showSuccess("Notification template deactivated.");
      } else {
        await notificationApi.activateTemplate(template.id);
        showSuccess("Notification template activated.");
      }
      await loadTemplates();
    } catch {
      showError("Notification template status could not be updated.");
    }
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Communications"
        title="Notification Templates"
        description="Manage the in-app and email templates used across user, dispatch, compliance, and billing workflows."
      >
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openCreateDialog}
        >
          New Template
        </Button>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by code, name, or event"
          value={keyword}
          onChange={(event) => {
            setPage(0);
            setKeyword(event.target.value);
          }}
          fullWidth
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(event) => {
            setPage(0);
            setStatus(event.target.value as NotificationTemplateStatus | "");
          }}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {notificationTemplateStatusOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Channel"
          value={channel}
          onChange={(event) => {
            setPage(0);
            setChannel(event.target.value as NotificationChannel | "");
          }}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">All Channels</MenuItem>
          {notificationChannelOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Event Type"
          value={eventType}
          onChange={(event) => {
            setPage(0);
            setEventType(event.target.value as NotificationType | "");
          }}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">All Events</MenuItem>
          {notificationTypeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
      </AdminFilterBar>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <PageCard sx={{ p: 0 }}>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState
            title="No templates found"
            description="Create a tenant template to override the default rendered content for operational notifications."
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Template</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Channel</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <strong>{item.name}</strong>
                        <span>{item.templateCode}</span>
                      </Stack>
                    </TableCell>
                    <TableCell>{item.eventType.replaceAll("_", " ")}</TableCell>
                    <TableCell>{item.channel.replaceAll("_", " ")}</TableCell>
                    <TableCell>
                      <StatusChip value={item.status} />
                    </TableCell>
                    <TableCell>
                      {formatDateTime(item.updatedAt ?? item.createdAt)}
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <TableActionButton
                          title="Edit"
                          onClick={() => openEditDialog(item)}
                        >
                          <EditRoundedIcon />
                        </TableActionButton>
                        <TableActionButton
                          title={
                            item.status === "ACTIVE" ? "Deactivate" : "Activate"
                          }
                          onClick={() => void handleToggleStatus(item)}
                        >
                          {item.status === "ACTIVE" ? (
                            <PauseRoundedIcon />
                          ) : (
                            <BoltRoundedIcon />
                          )}
                        </TableActionButton>
                      </Stack>
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {selectedTemplate
            ? "Edit Notification Template"
            : "Create Notification Template"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Event Type"
                value={form.eventType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    eventType: event.target.value as NotificationType,
                  }))
                }
                fullWidth
              >
                {notificationTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Channel"
                value={form.channel}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    channel: event.target.value as NotificationChannel,
                  }))
                }
                fullWidth
              >
                {notificationChannelOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            {form.channel === "EMAIL" ? (
              <TextField
                label="Subject Template"
                value={form.subjectTemplate ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subjectTemplate: event.target.value,
                  }))
                }
                fullWidth
              />
            ) : (
              <TextField
                label="Title Template"
                value={form.titleTemplate ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    titleTemplate: event.target.value,
                  }))
                }
                fullWidth
              />
            )}
            <TextField
              label="Body Template"
              value={form.bodyTemplate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bodyTemplate: event.target.value,
                }))
              }
              multiline
              minRows={5}
              fullWidth
              helperText="Use {{placeholder}} syntax for dynamic values."
            />
            <TextField
              label="Description"
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              multiline
              minRows={2}
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(form.isDefault)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isDefault: event.target.checked,
                    }))
                  }
                />
              }
              label="Use as the preferred tenant template for this event and channel"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={saving}
          >
            {selectedTemplate ? "Save Changes" : "Create Template"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
