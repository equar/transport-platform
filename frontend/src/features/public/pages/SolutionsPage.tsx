import { Box, Stack, Typography } from "@mui/material";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { PublicSection } from "../components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";

const solutions = [
  {
    title: "Student transportation",
    description:
      "Coordinate riders, guardians, recurring routes, driver readiness, and day-of-service changes while maintaining operational accountability.",
  },
  {
    title: "Elderly transportation",
    description:
      "Support care-oriented transportation programs that require clear communication, reliable scheduling, and strong visibility into service delivery.",
  },
  {
    title: "NEMT",
    description:
      "Handle medically related trip scheduling, compliance, billing, and coordination with the rigor expected in sensitive service environments.",
  },
  {
    title: "Organization and contract transportation",
    description:
      "Support roster-driven service, contract execution, and billing relationships for schools, employers, agencies, and community programs.",
  },
  {
    title: "Private scheduled rides",
    description:
      "Manage booked service, repeat riders, operational dispatching, and stakeholder communications for premium or specialized ride programs.",
  },
];

export function SolutionsPage() {
  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <PublicSection
        eyebrow="Solutions"
        title="Built for the programs you run, not just the trips you schedule."
        description="Whether you operate student routes, NEMT trips, elderly transportation, or contracted mobility programs, Transport Platform is designed around the service models you actually manage."
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          {solutions.map((solution) => (
            <PageCard key={solution.title} sx={{ height: "100%" }}>
              <Stack spacing={1.5}>
                <Typography variant="h4">{solution.title}</Typography>
                <Typography color="text.secondary">
                  {solution.description}
                </Typography>
              </Stack>
            </PageCard>
          ))}
        </Box>
      </PublicSection>

      <PublicSection
        eyebrow="Operating context"
        title="The product story changes by service model, but the platform foundation stays consistent."
        description="Whether the customer is transporting students, elderly passengers, medical riders, contracted rosters, or private scheduled trips, the platform still needs to connect users, vehicles, schedules, dispatching, communications, and billing inside one governed workflow."
      >
        <PageCard>
          <Typography color="text.secondary">
            That consistency is the point. Buyers can see how the platform
            adapts to different transportation programs without requiring a
            different system for every line of business.
          </Typography>
        </PageCard>
      </PublicSection>

      <PublicCtaBand
        eyebrow="Discuss your program"
        title="Map the platform to your transportation model before rollout begins."
        description="Tell us about your service type and we will show you exactly how the platform supports your specific workflows and compliance needs."
        primaryLabel="Request Demo"
        primaryTo="/contact#request-demo"
        secondaryLabel="Apply to Join"
        secondaryTo="/apply"
      />
    </Stack>
  );
}
