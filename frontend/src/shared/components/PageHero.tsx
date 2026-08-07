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
    <Box sx={{ position: "relative", overflow: "hidden", p: { xs: 3.25, md: 5 }, minHeight: { md: 268 }, display: "flex", alignItems: "center", borderRadius: 3.5, color: "common.white", background: "radial-gradient(circle at 85% 15%, rgba(68,152,164,.55), transparent 27%), radial-gradient(circle at 72% 115%, rgba(222,132,62,.48), transparent 35%), linear-gradient(125deg, #071f27 0%, #0b3c49 52%, #125968 100%)", boxShadow: "0 24px 60px rgba(7,31,39,.2)", "&::after": { content: '""', position: "absolute", inset: 0, opacity: .14, backgroundImage: "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)", backgroundSize: "36px 36px", maskImage: "linear-gradient(90deg, transparent 40%, black)" } }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ md: "center" }} justifyContent="space-between" sx={{ position: "relative", zIndex: 1 }}>
        <Stack spacing={1.75} sx={{ maxWidth: 800 }}>
          <Typography variant="overline" sx={{ color: "rgba(255,255,255,.72)" }}>{eyebrow}</Typography>
          <Typography variant="h3" color="inherit">{title}</Typography>
          <Typography sx={{ color: "rgba(255,255,255,.74)", maxWidth: 680, fontSize: { xs: "1rem", md: "1.12rem" }, lineHeight: 1.6 }}>{description}</Typography>
          {children ? <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} useFlexGap flexWrap="wrap" sx={{ pt: 1, "& .MuiButton-outlined": { color: "common.white", borderColor: "rgba(255,255,255,.4)" }, "& .MuiButton-contained": { bgcolor: "common.white", color: "primary.dark", "&:hover": { bgcolor: "rgba(255,255,255,.9)" } } }}>{children}</Stack> : null}
        </Stack>
        {visual ? <Box sx={{ flexShrink: 0 }}>{visual}</Box> : null}
      </Stack>
    </Box>
  );
}
