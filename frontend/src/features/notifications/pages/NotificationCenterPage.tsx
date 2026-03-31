import DraftsRoundedIcon from "@mui/icons-material/DraftsRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
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
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  notificationApi,
  notificationChannelOptions,
  notificationTypeOptions,
  type NotificationChannel,
  type NotificationDetailRecord,
  type NotificationReadStatus,
  type NotificationSummaryRecord,
  type NotificationType,
} from "../api/notificationApi";

const readStatusOptions: NotificationReadStatus[] = ["UNREAD", "READ"];

export function NotificationCenterPage() {
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<NotificationSummaryRecord[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationDetailRecord | null>(null);
  const [keyword, setKeyword] = useState("");
  const [readStatus, setReadStatus] = useState<NotificationReadStatus | "">("");
  const [channel, setChannel] = useState<NotificationChannel | "">("");
  const [notificationType, setNotificationType] = useState<
    NotificationType | ""
  >("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationApi.searchNotifications({
        keyword,
        readStatus,
        channel,
        notificationType,
        page,
        size,
        sortBy: "createdAt",
        sortDirection: "DESC",
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Notifications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, [channel, keyword, notificationType, page, readStatus, size]);

  async function handleOpen(notificationId: number) {
    try {
      const response = await notificationApi.getNotification(notificationId);
      setSelectedNotification(response);
      if (response.readStatus === "UNREAD") {
        await notificationApi.markRead(notificationId);
        await loadNotifications();
      }
    } catch {
      showError("Notification details could not be loaded.");
    }
  }

  async function handleMarkAllRead() {
    setActioning(true);
    try {
      const response = await notificationApi.markAllRead();
      showSuccess(`${response.updatedCount} notifications marked as read.`);
      await loadNotifications();
    } catch {
      showError("Notifications could not be marked as read.");
    } finally {
      setActioning(false);
    }
  }

  async function handleToggleRead(record: NotificationSummaryRecord) {
    setActioning(true);
    try {
      if (record.readStatus === "UNREAD") {
        await notificationApi.markRead(record.id);
        showSuccess("Notification marked as read.");
      } else {
        await notificationApi.markUnread(record.id);
        showSuccess("Notification marked as unread.");
      }
      await loadNotifications();
    } catch {
      showError("Notification state could not be updated.");
    } finally {
      setActioning(false);
    }
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Batch 6A"
        title="Notification Center"
        description="Track in-app alerts, email hook delivery state, and operator follow-up without leaving the tenant admin workspace."
      >
        <Button
          variant="contained"
          startIcon={<MarkEmailReadRoundedIcon />}
          onClick={() => void handleMarkAllRead()}
          disabled={actioning}
        >
          Mark All Read
        </Button>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by title, code, or message"
          value={keyword}
          onChange={(event) => {
            setPage(0);
            setKeyword(event.target.value);
          }}
          fullWidth
        />
        <TextField
          select
          label="Read State"
          value={readStatus}
          onChange={(event) => {
            setPage(0);
            setReadStatus(event.target.value as NotificationReadStatus | "");
          }}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">All States</MenuItem>
          {readStatusOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
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
          label="Type"
          value={notificationType}
          onChange={(event) => {
            setPage(0);
            setNotificationType(event.target.value as NotificationType | "");
          }}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All Types</MenuItem>
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
            title="No notifications found"
            description="Operational, billing, and compliance alerts will appear here as workflows run."
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Notification</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Channel</TableCell>
                  <TableCell>Delivery</TableCell>
                  <TableCell>Read</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography
                          fontWeight={item.readStatus === "UNREAD" ? 700 : 500}
                        >
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.notificationCode}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {item.notificationType.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell>{item.channel.replaceAll("_", " ")}</TableCell>
                    <TableCell>
                      <StatusChip value={item.deliveryStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusChip value={item.readStatus} />
                    </TableCell>
                    <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <TableActionButton
                          title="View"
                          onClick={() => void handleOpen(item.id)}
                        >
                          <VisibilityRoundedIcon />
                        </TableActionButton>
                        <TableActionButton
                          title={
                            item.readStatus === "UNREAD"
                              ? "Mark Read"
                              : "Mark Unread"
                          }
                          onClick={() => void handleToggleRead(item)}
                        >
                          <DraftsRoundedIcon />
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

      <Drawer
        anchor="right"
        open={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 440 }, p: 3 } }}
      >
        {selectedNotification ? (
          <Stack spacing={2.5}>
            <Typography variant="h4">{selectedNotification.title}</Typography>
            <StatusChip value={selectedNotification.readStatus} />
            <Typography color="text.secondary">
              {selectedNotification.message}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Notification Code: {selectedNotification.notificationCode}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Type: {selectedNotification.notificationType.replaceAll("_", " ")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Delivery:{" "}
              {selectedNotification.deliveryStatus.replaceAll("_", " ")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created: {formatDateTime(selectedNotification.createdAt)}
            </Typography>
            {selectedNotification.metadataJson ? (
              <PageCard>
                <Typography variant="subtitle2">Metadata</Typography>
                <Typography
                  component="pre"
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", mb: 0 }}
                >
                  {selectedNotification.metadataJson}
                </Typography>
              </PageCard>
            ) : null}
          </Stack>
        ) : null}
      </Drawer>
    </Stack>
  );
}
