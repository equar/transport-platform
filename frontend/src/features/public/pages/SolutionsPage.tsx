import { Box, Stack, Typography } from "@mui/material";
import { PlatformImage } from "../components/PlatformImage";
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
    title: "Senior & community transportation",
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
        title="Different journeys. The same attention to people."
        description="Give schools, care programs, and transportation providers the tools to coordinate reliable service around the people they serve."
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

      <PublicSection eyebrow="Built around your service" title="Keep every team connected to the journey."
        description="Bring program coordinators, dispatchers, drivers, riders, and guardians together with separate workspaces and relevant trip information.">
        <PlatformImage name="platform" />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 3, mt: 4 }}>
          {[['Know the rider', 'Keep pickup instructions, guardian contacts, and recorded accessibility needs available to the people delivering the trip.'],
            ['Coordinate the service', 'Organize repeat schedules, route stops, and driver and vehicle assignments from a shared operational view.'],
            ['Keep people informed', 'Help riders and guardians find active trips, follow shared locations, and reach their assigned driver.']].map(([title, text]) => <Box key={title}><Typography variant="h6" mb={1}>{title}</Typography><Typography color="text.secondary">{text}</Typography></Box>)}
        </Box>
      </PublicSection>

      <PublicCtaBand
        eyebrow="Discuss your program"
        title="Map the platform to your transportation model before rollout begins."
        description="Tell us who you serve and how you operate. We’ll walk through the workflows that fit your program."
        primaryLabel="Request Demo"
        primaryTo="/contact#request-demo"
        secondaryLabel="Apply to Join"
        secondaryTo="/apply"
      />
    </Stack>
  );
}
