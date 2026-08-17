import type { PropsWithChildren } from "react";
import { Box, Stack, Typography } from "@mui/material";

export function FormSection({ title, description, children }: PropsWithChildren<{ title: string; description?: string }>) {
  return <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ py: 2.5, borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
    <Box sx={{ width: { md: 220 }, flexShrink: 0 }}><Typography variant="subtitle1" sx={{ color: "primary.dark" }}>{title}</Typography>{description ? <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{description}</Typography> : null}</Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
  </Stack>;
}
