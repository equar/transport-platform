import { Suspense, useEffect, useMemo, useState } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import {
  AppBar,
  Avatar,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { BrandMark } from "../../../shared/components/BrandMark";
import { getRoleLabel } from "../../auth/access";
import { useAuth } from "../../auth/context/AuthContext";
import { notificationApi } from "../../notifications/api/notificationApi";
import { organizationPortalNavigationItems } from "./organizationPortalNavigation";
import { LoadingState } from "../../../shared/components/LoadingState";

function isActivePath(currentPath: string, targetPath: string) {
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function getDisplayName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

function getInitials(label: string) {
  return label
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function OrganizationPortalLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { session, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const displayName =
    getDisplayName(session?.identity.firstName, session?.identity.lastName) ||
    session?.identity.email ||
    "Organization User";

  const currentItem = useMemo(
    () =>
      [...organizationPortalNavigationItems]
        .sort((left, right) => right.to.length - left.to.length)
        .find((item) => isActivePath(location.pathname, item.to)) ??
      organizationPortalNavigationItems[0],
    [location.pathname],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadUnreadCount() {
      try {
        const response = await notificationApi.getUnreadCount();
        if (!cancelled) {
          setUnreadCount(response.unreadCount);
        }
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    }

    void loadUnreadCount();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const drawer = (
    <Stack sx={{ height: "100%" }}>
      <Box sx={{ px: 2.5, py: 3 }}>
        <BrandMark compact />
      </Box>
      <Divider />
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography variant="overline" color="secondary.main">
          Organization Portal
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Business-facing access to riders, rides, contracts, billing, and
          alerts.
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1.5, py: 1.5, flexGrow: 1 }}>
        {organizationPortalNavigationItems.map((item) => {
          const selected = isActivePath(location.pathname, item.to);
          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={selected}
              onClick={() => setMobileOpen(false)}
              sx={{
                mb: 0.75,
                alignItems: "flex-start",
                py: 1,
                "&.Mui-selected": {
                  bgcolor: "rgba(49, 91, 125, 0.10)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: selected ? "primary.main" : "text.secondary",
                  mt: 0.25,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.description}
                primaryTypographyProps={{
                  fontWeight: selected ? 700 : 600,
                  color: selected ? "primary.main" : "text.primary",
                }}
                secondaryTypographyProps={{ sx: { lineHeight: 1.35 } }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Stack spacing={1.25}>
          <Chip
            label={
              (session?.identity.roles ?? []).map(getRoleLabel).join(", ") ||
              "Organization user"
            }
            color="secondary"
            variant="outlined"
            sx={{ justifyContent: "flex-start" }}
          />
          <Button
            component={RouterLink}
            to="/portal/organization/profile"
            startIcon={<PersonRoundedIcon />}
            color="inherit"
          >
            View organization profile
          </Button>
          <Button
            startIcon={<LogoutRoundedIcon />}
            color="inherit"
            onClick={() => {
              signOut();
              navigate("/login", { replace: true });
            }}
          >
            Sign out
          </Button>
        </Stack>
      </Box>
    </Stack>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(11, 92, 116, 0.10), transparent 28%), radial-gradient(circle at right, rgba(189, 119, 62, 0.10), transparent 24%), linear-gradient(180deg, #f6f4ee 0%, #eef2ee 48%, #f8f7f2 100%)",
        pb: { xs: 9, md: 0 },
      }}
    >
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "rgba(248, 247, 242, 0.90)",
          backdropFilter: "blur(14px)",
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton color="inherit" onClick={() => setMobileOpen(true)}>
            <MenuRoundedIcon />
          </IconButton>
          <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="overline" color="secondary.main">
              Organization Portal
            </Typography>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }} noWrap>
              {currentItem.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {currentItem.description}
            </Typography>
          </Stack>
          <IconButton
            color="inherit"
            component={RouterLink}
            to="/portal/organization/notifications"
          >
            <Badge color="secondary" badgeContent={unreadCount} max={99}>
              <NotificationsRoundedIcon />
            </Badge>
          </IconButton>
          <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main" }}>
            {getInitials(displayName)}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: 320,
            maxWidth: "calc(100vw - 24px)",
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          width: "100%",
          maxWidth: 1120,
          mx: "auto",
          px: { xs: 2, md: 3 },
          py: { xs: 3, md: 4 },
        }}
      >
        <Suspense
          fallback={
            <LoadingState
              title="Loading organization portal"
              description="Please wait while the latest roster, contract, and billing details are prepared."
              minHeight={320}
            />
          }
        >
          <Outlet />
        </Suspense>
      </Box>

      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          display: { xs: "block", md: "none" },
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "rgba(252, 252, 250, 0.96)",
          backdropFilter: "blur(14px)",
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <BottomNavigation showLabels value={currentItem.to}>
          {organizationPortalNavigationItems.map((item) => (
            <BottomNavigationAction
              key={item.to}
              component={RouterLink}
              to={item.to}
              value={item.to}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Box>
    </Box>
  );
}
