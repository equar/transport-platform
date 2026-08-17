import type { PropsWithChildren, ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

interface PageHeroProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  visual?: ReactNode;
}

export function PageHero({ eyebrow, title, description, children, visual }: PageHeroProps) {
  return (
    <Box sx={{ position: "relative", overflow: "hidden", p: { xs: 3, md: 4 }, display: "flex", alignItems: "center", color: "common.white", background: "radial-gradient(circle at 88% 20%, rgba(255,255,255,.12), transparent 26%), linear-gradient(135deg, #263845 0%, #355162 54%, #43657b 100%)", border: "1px solid rgba(26,46,60,.42)", borderRadius: 4, boxShadow: "0 18px 40px rgba(19,35,45,.18)", "&::before": { content: '\"\"', position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(255,255,255,.08), transparent 42%)" }, "&::after": { content: '\"\"', position: "absolute", inset: 0, opacity: .08, backgroundImage: "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)", backgroundSize: "32px 32px", maskImage: "linear-gradient(90deg, transparent 40%, black)" } }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ md: "center" }} justifyContent="space-between" sx={{ position: "relative", zIndex: 1 }}>
        <Stack spacing={.75} sx={{ maxWidth: 900 }}>
          <Typography variant="overline" sx={{ color: "rgba(255,255,255,.72)" }}>{eyebrow}</Typography>
          <Typography variant="h4" color="inherit" sx={{ maxWidth: 880 }}>{title}</Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,.8)", maxWidth: 760 }}>{description}</Typography>
          {children ? <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap" sx={{ pt: 1.25, "& .MuiButton-outlined": { color: "common.white", borderColor: "rgba(255,255,255,.36)", bgcolor: "rgba(255,255,255,.04)" }, "& .MuiButton-contained": { bgcolor: "common.white", color: "primary.dark", "&:hover": { bgcolor: "rgba(255,255,255,.94)" } } }}>{children}</Stack> : null}
        </Stack>
        {visual ? <Box sx={{ flexShrink: 0 }}>{visual}</Box> : null}
      </Stack>
    </Box>
  );
}
