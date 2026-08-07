import { Box, Chip, Stack, Typography } from "@mui/material";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import { PageCard } from "./PageCard";

export type PulseItem = { label: string; value: number; color?: "primary" | "secondary" | "success" | "warning" | "error" };

export function OperationsPulse({ title, description, items }: { title: string; description: string; items: PulseItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <PageCard sx={{ height: "100%", p: { xs: 2.5, md: 3.25 } }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5">{title}</Typography>
            <Typography variant="body2" color="text.secondary">{description}</Typography>
          </Stack>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "primary.main", color: "white", flexShrink: 0 }}><AutoGraphRoundedIcon /></Box>
        </Stack>
        <Stack spacing={2.25}>
          {items.map((item) => (
            <Stack key={item.label} spacing={0.75}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight={700}>{item.label}</Typography>
                <Chip size="small" label={item.value.toLocaleString()} color={item.color ?? "primary"} sx={{ minWidth: 48 }} />
              </Stack>
              <Box sx={{ height: 9, borderRadius: 99, bgcolor: "action.hover", overflow: "hidden" }}>
                <Box sx={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 7 : 0)}%`, height: "100%", borderRadius: 99, bgcolor: `${item.color ?? "primary"}.main`, backgroundImage: "linear-gradient(90deg, rgba(255,255,255,.12), transparent)", transition: "width 500ms ease" }} />
              </Box>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </PageCard>
  );
}
