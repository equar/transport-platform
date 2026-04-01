import { Box, Container, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useRuntimeCapabilities } from "../../runtime/context/RuntimeCapabilitiesContext";
import { BrandMark } from "../../../shared/components/BrandMark";
import { publicFooterSections } from "../content/siteContent";

export function PublicFooter() {
  const { branding } = useRuntimeCapabilities();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "rgba(255, 255, 255, 0.86)",
        backdropFilter: "blur(18px)",
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
        <Stack spacing={5}>
          <Box
            sx={{
              display: "grid",
              gap: 4,
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(280px, 1.2fr) repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            <Stack spacing={2} sx={{ maxWidth: 360 }}>
              <BrandMark compact />
              <Typography color="text.secondary">
                {branding?.customFooterText ||
                  "Operational control, onboarding, tenant governance, and portal access brought together in one transportation SaaS platform."}
              </Typography>
              <Stack spacing={0.75}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Contact
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {branding?.supportEmail || "support@transportplatform.com"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {branding?.supportPhone || "+1 (800) 555-0189"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  200 Fleet Exchange Plaza, Suite 500
                </Typography>
              </Stack>
            </Stack>

            {publicFooterSections.map((section) => (
              <Stack key={section.title} spacing={1.25}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {section.title}
                </Typography>
                {section.links.map((link) =>
                  link.placeholder ? (
                    <Typography
                      key={link.label}
                      variant="body2"
                      color="text.secondary"
                    >
                      {link.label}
                    </Typography>
                  ) : (
                    <Link
                      key={link.label}
                      component={RouterLink}
                      to={link.to || "/"}
                      color="text.secondary"
                      underline="hover"
                    >
                      {link.label}
                    </Link>
                  ),
                )}
              </Stack>
            ))}
          </Box>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            justifyContent="space-between"
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()}{" "}
              {branding?.displayName || "Transport Platform"}. All rights
              reserved.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Built for enterprise transportation operators, brokers, care
              networks, and fleet-driven service teams.
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
