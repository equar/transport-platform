import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { EmptyState } from "./EmptyState";
import { PageCard } from "./PageCard";
import { formatStatusLabel } from "./StatusChip";
import { formatDateTime } from "../utils/format";

export interface RecentActivityItem {
  id: number;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  tenantId: string | null;
}

interface RecentActivityListProps {
  title: string;
  description: string;
  items: RecentActivityItem[];
}

export function RecentActivityList({
  title,
  description,
  items,
}: RecentActivityListProps) {
  return (
    <PageCard sx={{ height: "100%" }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h5">{title}</Typography>
          <Typography variant="body2" color="text.secondary">{description}</Typography>
        </Stack>
        {items.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="Administrative activity will appear here as actions are taken across the current workspace."
          />
        ) : (
          <List disablePadding>
            {items.map((item, index) => (
              <div key={item.id}>
                <ListItem disableGutters sx={{ py: 1.25, px: 1, borderRadius: 1, "&:hover": { bgcolor: "#f7fafb" } }}>
                  <ListItemText
                    primary={item.summary}
                    primaryTypographyProps={{ fontWeight: 700, sx: { mb: 0.4 } }}
                    secondary={`${formatDateTime(item.createdAt)} • ${item.actorName || item.actorEmail || "System"} • ${formatStatusLabel(item.module)} / ${formatStatusLabel(item.action)}`}
                  />
                </ListItem>
                {index < items.length - 1 ? <Divider /> : null}
              </div>
            ))}
          </List>
        )}
      </Stack>
    </PageCard>
  );
}
