import { useState } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { BrandMark } from "../../../shared/components/BrandMark";
import { publicNavigationItems } from "../content/siteContent";

function isActivePath(currentPath: string, targetPath: string) {
  if (targetPath === "/") {
    return currentPath === "/";
  }

  return currentPath.startsWith(targetPath);
}

export function PublicHeader() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const actionButtons = (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
      <Button component={RouterLink} to="/login" variant="text" color="inherit">
        Login
      </Button>
      <Button
        component={RouterLink}
        to="/contact#request-demo"
        variant="outlined"
        endIcon={<LaunchRoundedIcon />}
      >
        Request Demo
      </Button>
      <Button component={RouterLink} to="/apply" variant="contained">
        Apply to Join
      </Button>
    </Stack>
  );

  return (
    <>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "rgba(247, 248, 244, 0.82)",
          backdropFilter: "blur(18px)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: 88, gap: 2 }}>
            <Box
              component={RouterLink}
              to="/"
              sx={{ textDecoration: "none", color: "inherit", flexShrink: 0 }}
            >
              <BrandMark compact />
            </Box>

            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                ml: "auto",
                display: { xs: "none", lg: "flex" },
                alignItems: "center",
              }}
            >
              {publicNavigationItems.map((item) => {
                const active = isActivePath(location.pathname, item.to);
                return (
                  <Button
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    color="inherit"
                    sx={{
                      px: 1.5,
                      color: active ? "primary.main" : "text.primary",
                      fontWeight: active ? 700 : 600,
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Stack>

            <Box sx={{ display: { xs: "none", lg: "block" } }}>
              {actionButtons}
            </Box>

            <IconButton
              color="inherit"
              onClick={() => setMobileOpen(true)}
              sx={{ ml: "auto", display: { xs: "inline-flex", lg: "none" } }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      >
        <Stack sx={{ width: 320, p: 3 }} spacing={2.5}>
          <BrandMark compact />
          <Divider />
          <Stack spacing={0.75}>
            {publicNavigationItems.map((item) => {
              const active = isActivePath(location.pathname, item.to);
              return (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  color="inherit"
                  sx={{
                    justifyContent: "flex-start",
                    color: active ? "primary.main" : "text.primary",
                    fontWeight: active ? 700 : 600,
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>
          <Divider />
          {actionButtons}
          <Typography variant="body2" color="text.secondary">
            Enterprise transportation SaaS for fleets, brokers, care programs,
            and regulated service operations.
          </Typography>
        </Stack>
      </Drawer>
    </>
  );
}
