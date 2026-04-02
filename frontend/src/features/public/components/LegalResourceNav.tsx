import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { PageCard } from "../../../shared/components/PageCard";

const legalResources = [
  {
    label: "Privacy and Data Handling",
    to: "/privacy",
  },
  {
    label: "Service Agreements",
    to: "/service-agreements",
  },
  {
    label: "Security Overview",
    to: "/security",
  },
  {
    label: "Data Processing Support",
    to: "/data-processing-support",
  },
];

interface LegalResourceNavProps {
  currentPath: string;
}

export function LegalResourceNav({ currentPath }: LegalResourceNavProps) {
  return (
    <PageCard>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="overline" color="secondary.main">
            Legal resources
          </Typography>
          <Typography variant="h5">
            Move between privacy, security, agreement, and processing guidance.
          </Typography>
          <Typography color="text.secondary">
            These pages are designed to work together so evaluation teams can
            review the topics most relevant to rollout, procurement, and legal
            review.
          </Typography>
        </Stack>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          useFlexGap
          flexWrap="wrap"
        >
          {legalResources.map((item) => {
            const isCurrent = item.to === currentPath;

            return (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                variant={isCurrent ? "contained" : "outlined"}
                color={isCurrent ? "secondary" : "primary"}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>
      </Stack>
    </PageCard>
  );
}
