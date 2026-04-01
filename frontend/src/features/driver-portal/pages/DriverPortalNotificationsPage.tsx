import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import MarkEmailUnreadRoundedIcon from "@mui/icons-material/MarkEmailUnreadRounded";
import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import {
  notificationApi,
  type NotificationSummaryRecord,
} from "../../notifications/api/notificationApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { formatDateTime } from "../../../shared/utils/format";

export function DriverPortalNotificationsPage() {
  const [items, setItems] = useState<NotificationSummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationApi.searchNotifications({
        page: 0,
        size: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      });
      setItems(response.items);
    } catch {
      setError("Notifications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function handleMarkAllRead() {
    setActionLoading(true);
    try {
      await notificationApi.markAllRead();
      await loadNotifications();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleRead(notification: NotificationSummaryRecord) {
    setActionLoading(true);
    try {
      if (notification.readStatus === "UNREAD") {
        await notificationApi.markRead(notification.id);
      } else {
        await notificationApi.markUnread(notification.id);
      }
      await loadNotifications();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Stack spacing={0.75}>
          <Typography variant="h4">My Notifications</Typography>
          <Typography color="text.secondary">
            Review recent alerts about rides, route changes, and compliance
            activity.
          </Typography>
        </Stack>
        <Button
          variant="outlined"
          startIcon={<DoneAllRoundedIcon />}
          onClick={handleMarkAllRead}
          disabled={
            actionLoading || items.every((item) => item.readStatus === "READ")
          }
        >
          Mark all read
        </Button>
      </Stack>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {items.length === 0 ? (
        <PageCard>
          <Typography color="text.secondary">
            You do not have any notifications right now.
          </Typography>
        </PageCard>
      ) : (
        items.map((notification) => (
          <PageCard key={notification.id}>
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1.5}
              >
                <Stack spacing={0.75}>
                  <Typography variant="h6">{notification.title}</Typography>
                  <Typography color="text.secondary">
                    {notification.message}
                  </Typography>
                </Stack>
                <Chip
                  label={
                    notification.readStatus === "UNREAD" ? "Unread" : "Read"
                  }
                  color={
                    notification.readStatus === "UNREAD"
                      ? "secondary"
                      : "default"
                  }
                  sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                />
              </Stack>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1.5}
                alignItems={{ sm: "center" }}
              >
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(notification.createdAt)}
                </Typography>
                <Button
                  size="small"
                  startIcon={<MarkEmailUnreadRoundedIcon />}
                  onClick={() => handleToggleRead(notification)}
                  disabled={actionLoading}
                >
                  {notification.readStatus === "UNREAD"
                    ? "Mark read"
                    : "Mark unread"}
                </Button>
              </Stack>
            </Stack>
          </PageCard>
        ))
      )}
    </Stack>
  );
}
