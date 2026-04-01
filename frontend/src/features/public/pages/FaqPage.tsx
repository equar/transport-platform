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
        question: "What does the public shell include right now?",
        answer:
          "It includes the public marketing pages, route structure, responsive layout, public CTA flows, and structured placeholders for forms that can be wired to backend services later.",
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
        question:
          "Can the application flow be connected to a real onboarding process later?",
        answer:
          "Yes. The page structure and form model are intentionally organized so backend or CRM integrations can be added without redesigning the public journey.",
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
          "Yes. The product direction includes invoice, payment, receivables, and reporting workflows as part of the broader operating model.",
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
        question:
          "Will the public experience stay aligned with tenant branding?",
        answer:
          "Yes. The shell already reuses the runtime-aware branding and theme primitives so the public-facing experience can stay aligned with the broader platform identity.",
      },
    ],
  },
  {
    title: "Roles and portals",
    items: [
      {
        question: "Which portal roles does the platform support?",
        answer:
          "The current architecture supports dedicated experiences for drivers, riders, guardians, and organization users alongside company and platform administration workspaces.",
      },
      {
        question:
          "Does the private application change when the public shell expands?",
        answer:
          "No. The public pages are intentionally isolated from the authenticated shell so the product can continue evolving without destabilizing the marketing or onboarding experience.",
      },
    ],
  },
];

export function FaqPage() {
  return (
    <Stack spacing={{ xs: 4, md: 6 }}>
      <PublicSection
        eyebrow="FAQ"
        title="Answer the questions evaluation teams actually ask before signing in."
        description="The FAQ page is now grouped by topic so visitors can quickly find the answers most relevant to their role in the buying or onboarding process."
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
        title="Move from FAQs into a real conversation."
        description="Visitors can now review grouped answers and then go directly into pricing or a guided product discussion."
        primaryLabel="Contact the team"
        primaryTo="/contact#request-demo"
        secondaryLabel="Review pricing"
        secondaryTo="/pricing"
      />
    </Stack>
  );
}
