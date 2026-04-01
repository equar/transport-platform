import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { PublicSection } from "../components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";

const faqGroups = [
  {
    title: "General",
    items: [
      {
        question: "Who is the platform designed for?",
        answer:
          "The platform is designed for multi-tenant transportation operations that need to support platform administrators, company teams, drivers, riders, guardians, and organization stakeholders within one governed system.",
      },
      {
        question: "What types of transportation programs does it support?",
        answer:
          "The platform supports student transportation, elderly transportation, NEMT, organization and contract transportation, and private scheduled ride programs. Each service model is supported through the same core operational architecture.",
      },
    ],
  },
  {
    title: "Onboarding",
    items: [
      {
        question: "How does onboarding start?",
        answer:
          "Teams can request a demo, apply to join, or begin a scoped rollout conversation depending on where they are in the evaluation process.",
      },
      {
        question: "How long does it take to get operational?",
        answer:
          "Most teams are fully operational within a few weeks. The platform is structured around a clear setup sequence that takes you from tenant provisioning through riders, drivers, vehicles, and scheduling into day-of-service execution.",
      },
    ],
  },
  {
    title: "Billing",
    items: [
      {
        question: "Is pricing fixed for every customer?",
        answer:
          "No. The public pricing page provides packaging guidance, but transportation programs often need phased rollout, contract considerations, or custom deployment support.",
      },
      {
        question: "Can the platform support invoices and payments?",
        answer:
          "Yes. The platform includes invoice management, payment recording, receivables tracking, and financial reporting workflows as part of the broader operating model.",
      },
    ],
  },
  {
    title: "Security",
    items: [
      {
        question: "How is access separated across organizations and roles?",
        answer:
          "The platform is built on tenant-aware access boundaries, role-based routing, and distinct portal surfaces for different user groups.",
      },
      {
        question: "Is company data kept separate across tenants?",
        answer:
          "Yes. Each company operates in its own tenant workspace with strict data separation. Platform administrators have governance access without exposing one tenant's data to another.",
      },
    ],
  },
  {
    title: "Roles and portals",
    items: [
      {
        question: "Which portal roles does the platform support?",
        answer:
          "The platform supports dedicated experiences for drivers, riders, guardians, and organization users alongside company and platform administration workspaces.",
      },
      {
        question: "Can external users like riders and guardians access the platform?",
        answer:
          "Yes. Riders, guardians, and organization contacts each have their own portal with the right level of access. They can view rides, billing, rosters, and notifications without seeing internal company operations.",
      },
    ],
  },
];

export function FaqPage() {
  return (
    <Stack spacing={{ xs: 4, md: 6 }}>
      <PublicSection
        eyebrow="FAQ"
        title="Answers to the questions we hear most."
        description="Browse by topic to find the information most relevant to your role and stage of evaluation."
      >
        <Stack spacing={3}>
          {faqGroups.map((group) => (
            <PageCard key={group.title} sx={{ maxWidth: 980 }}>
              <Stack spacing={2}>
                <Typography variant="h4">{group.title}</Typography>
                {group.items.map((item) => (
                  <Accordion key={item.question} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                      <Typography variant="h6">{item.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography color="text.secondary">
                        {item.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </PageCard>
          ))}
        </Stack>
      </PublicSection>

      <PublicCtaBand
        eyebrow="Still have questions"
        title="Still have questions? Our team is happy to help."
        description="Reach out and let us know what you need. We are happy to answer anything not covered here or schedule time for a more detailed conversation."
        primaryLabel="Contact the team"
        primaryTo="/contact#request-demo"
        secondaryLabel="Review pricing"
        secondaryTo="/pricing"
      />
    </Stack>
  );
}
