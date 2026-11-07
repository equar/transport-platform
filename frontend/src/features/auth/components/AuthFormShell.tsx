import type { PropsWithChildren, ReactNode } from "react";
import { Alert, Box, Divider, Stack, Typography } from "@mui/material";
import { PageCard } from "../../../shared/components/PageCard";

interface AuthFormShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  tone?: "default" | "warning";
  status?: {
    severity: "success" | "info" | "warning" | "error";
    message: string;
  } | null;
  footer?: ReactNode;
  aside?: ReactNode;
  maxWidth?: number;
}

export function AuthFormShell({
  eyebrow,
  title,
  description,
  tone = "default",
  status,
  footer,
  aside,
  maxWidth = 760,
  children,
}: AuthFormShellProps) {
  return (
    <PageCard
      sx={{
        maxWidth,
        mx: "auto",
        width: "100%",
        borderColor: tone === "warning" ? "warning.light" : "divider",
        background:
          tone === "warning"
            ? "linear-gradient(180deg, rgba(255, 244, 229, 0.96) 0%, rgba(255, 255, 255, 0.92) 100%)"
            : undefined,
      }}
    >
      <Stack spacing={3.5}>
        <Box>
          <Typography variant="overline" color="secondary.main">
            {eyebrow}
          </Typography>
          <Typography variant="h3" sx={{ mt: 1 }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>
            {description}
          </Typography>
        </Box>

        {status ? (
          <Alert severity={status.severity}>
            {status.message}
          </Alert>
        ) : null}

        {children}

        {aside || footer ? (
          <Stack spacing={2.5}>
            <Divider />
            {aside ? <Box>{aside}</Box> : null}
            {footer ? <Box>{footer}</Box> : null}
          </Stack>
        ) : null}
      </Stack>
    </PageCard>
  );
}
