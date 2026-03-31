import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import DriveEtaRoundedIcon from "@mui/icons-material/DriveEtaRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";
import { getRoleLabel, isPlatformAdmin } from "../../features/auth/access";
import { useAuth } from "../../features/auth/context/AuthContext";
import { BrandMark } from "../../shared/components/BrandMark";

const drawerWidth = 280;

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, signOut } = useAuth();
  const location = useLocation();
  const platformAdmin = isPlatformAdmin(session);
  const navigationItems = platformAdmin
    ? [
        {
          label: "Platform Dashboard",
          description: "Portfolio health, onboarding, and user signals",
          to: "/platform",
          icon: <DashboardRoundedIcon fontSize="small" />,
        },
        {
          label: "Tenant Management",
          description: "Provisioned customer organizations",
          to: "/platform/tenants",
          icon: <ApartmentRoundedIcon fontSize="small" />,
        },
        {
          label: "Company Applications",
          description: "Public intake and review queue",
          to: "/platform/company-applications",
          icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
        },
        {
          label: "User Management",
          description: "Cross-tenant user administration",
          to: "/platform/users",
          icon: <BadgeRoundedIcon fontSize="small" />,
        },
        {
          label: "Role Catalog",
          description: "Governed access model and assignments",
          to: "/platform/roles",
          icon: <SecurityRoundedIcon fontSize="small" />,
        },
        {
          label: "Audit Logs",
          description: "Platform-wide administrative activity",
          to: "/platform/audit-logs",
          icon: <HistoryRoundedIcon fontSize="small" />,
        },
      ]
    : [
        {
          label: "Company Dashboard",
          description: "Team access, user health, and admin coverage",
          to: "/company",
          icon: <DashboardRoundedIcon fontSize="small" />,
        },
        {
          label: "User Management",
          description: "Manage company administrators and operators",
          to: "/company/users",
          icon: <BadgeRoundedIcon fontSize="small" />,
        },
        {
          label: "Driver Management",
          description: "Driver onboarding, readiness, and document control",
          to: "/company/drivers",
          icon: <DriveEtaRoundedIcon fontSize="small" />,
        },
        {
          label: "Role Catalog",
          description: "Tenant-safe role definitions and usage",
          to: "/company/roles",
          icon: <SecurityRoundedIcon fontSize="small" />,
        },
        {
          label: "Audit Logs",
          description: "Tenant administrative activity",
          to: "/company/audit-logs",
          icon: <HistoryRoundedIcon fontSize="small" />,
        },
      ];
  const shellTitle = platformAdmin
    ? "Operations Control Plane"
    : "Company Access Control";
  const shellDescription = platformAdmin
    ? "Platform-admin workspace for tenant onboarding, identity governance, and company intake review."
    : "Company-admin workspace for user lifecycle management and tenant role governance.";
  const displayName = [session?.identity.firstName, session?.identity.lastName]
    .filter(Boolean)
    .join(" ");

  const drawer = (
    <Stack sx={{ height: "100%" }}>
      <Box sx={{ p: 3 }}>
        <BrandMark compact />
      </Box>
      <Divider />
      <List sx={{ px: 1.5, py: 2 }}>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={RouterLink}
            to={item.to}
            selected={
              location.pathname === item.to ||
              location.pathname.startsWith(`${item.to}/`)
            }
            sx={{ borderRadius: 3, mb: 0.75 }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                }}
              >
                {item.icon}
              </Avatar>
              <ListItemText primary={item.label} secondary={item.description} />
            </Stack>
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ mt: "auto", px: 2.5, pb: 3 }}>
        <Stack spacing={1.5}>
          <Chip
            label={
              (session?.identity.roles ?? []).map(getRoleLabel).join(", ") ||
              "No roles"
            }
            color="secondary"
            variant="outlined"
          />
          <Button
            component={RouterLink}
            to="/apply"
            color="inherit"
            endIcon={<LaunchRoundedIcon />}
          >
            Open Public Application Form
          </Button>
        </Stack>
      </Box>
    </Stack>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "background.default",
      }}
    >
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "rgba(247, 248, 244, 0.88)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{shellTitle}</Typography>
            <Typography variant="body2" color="text.secondary">
              {shellDescription}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}
            >
              <Typography variant="body2" color="text.secondary">
                Signed in as
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {displayName || session?.identity.email || "Unknown"}
              </Typography>
            </Box>
            <Chip
              label={session?.identity.tenantId ?? "Platform scope"}
              color="primary"
              variant="outlined"
            />
            <Button
              color="inherit"
              startIcon={<LogoutRoundedIcon />}
              onClick={signOut}
            >
              Sign out
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "1px solid",
              borderColor: "divider",
              backgroundColor: "#fcfcfa",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
