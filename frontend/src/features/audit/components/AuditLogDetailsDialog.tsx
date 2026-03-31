import {
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import type { AuditLogRecord } from "../api/auditLogsApi";

interface AuditLogDetailsDialogProps {
  open: boolean;
  record: AuditLogRecord | null;
  onClose: () => void;
}

function formatJson(value: string | null) {
  if (!value) {
    return "No detail available.";
  }
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export function AuditLogDetailsDialog({
  open,
  record,
  onClose,
}: AuditLogDetailsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Audit Log Details</DialogTitle>
      <DialogContent>
        {record ? (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                Summary
              </Typography>
              <Typography>{record.summary}</Typography>
            </Stack>
            <Divider />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Previous Value
                </Typography>
                <Typography
                  component="pre"
                  sx={{ m: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                >
                  {formatJson(record.oldValueJson)}
                </Typography>
              </Stack>
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  New Value
                </Typography>
                <Typography
                  component="pre"
                  sx={{ m: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                >
                  {formatJson(record.newValueJson)}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
