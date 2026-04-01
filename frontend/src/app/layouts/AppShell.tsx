import { useEffect, useState } from "react";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  buildAppShellView,
  findAppShellNavItemForPath,
  getAppShellHomePath,
  getAppShellProfilePath,
} from "./appShellNavigation";
import { getRoleLabel } from "../../features/auth/access";
import { useAuth } from "../../features/auth/context/AuthContext";
import {
  notificationApi,
  type NotificationSummaryRecord,
} from "../../features/notifications/api/notificationApi";
import { useRuntimeCapabilities } from "../../features/runtime/context/RuntimeCapabilitiesContext";
import { BrandMark } from "../../shared/components/BrandMark";

const drawerWidth = 280;

function isRouteActive(currentPath: string, targetPath: string) {
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

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<HTMLElement | null>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState<
    NotificationSummaryRecord[]
  >([]);
  const { session, signOut } = useAuth();
  const { branding, capabilities, moduleAccess } = useRuntimeCapabilities();
  const location = useLocation();
  const navigate = useNavigate();
  const shellView = buildAppShellView(session, moduleAccess);
  const visibleSections = shellView.sections;
  const currentItem = findAppShellNavItemForPath(
    location.pathname,
    visibleSections,
  );
  const displayName =
    getDisplayName(session?.identity.firstName, session?.identity.lastName) ||
    session?.identity.email ||
    "Unknown user";
  const workspaceLabel =
    shellView.scope === "platform"
      ? "Platform scope"
      : branding?.displayName || session?.identity.tenantId || "Workspace";
  const driverPortal = shellView.scope === "driver";
  const riderPortal = shellView.scope === "rider";
  const organizationPortal = shellView.scope === "organization";
  const platformAdmin = shellView.scope === "platform";
  const workspaceHomePath = getAppShellHomePath(session, moduleAccess);
  const profilePath = getAppShellProfilePath(session, moduleAccess);
  const notificationTarget = driverPortal
    ? "/portal/driver/notifications"
    : riderPortal
      ? "/portal/rider/notifications"
      : organizationPortal
        ? "/portal/organization/notifications"
        : "/company/notifications";

  useEffect(() => {
    if (platformAdmin) {
      setUnreadCount(0);
      setLatestNotifications([]);
      return;
    }

    let cancelled = false;

    async function loadNotifications() {
      try {
        const [unread, latest] = await Promise.all([
          notificationApi.getUnreadCount(),
          notificationApi.getLatestNotifications(5),
        ]);
        if (cancelled) {
          return;
        }
        setUnreadCount(unread.unreadCount);
        setLatestNotifications(latest);
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
          setLatestNotifications([]);
        }
      }
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, platformAdmin]);

  const drawer = (
    <Stack sx={{ height: "100%" }}>
      <Box sx={{ px: 2.5, py: 3 }}>
        <BrandMark compact />
      </Box>
      <Divider />
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography variant="overline" color="secondary.main">
          {shellView.scopeLabel}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {workspaceLabel}
        </Typography>
      </Box>
      <Divider />

      <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1.5, py: 2 }}>
        <Stack spacing={2}>
          {visibleSections.map((section) => (
            <Box key={section.title}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ px: 1.5, pb: 1, display: "block" }}
              >
                {section.title}
              </Typography>
              <List disablePadding>
                {section.items.map((item) => {
                  const selected = isRouteActive(location.pathname, item.to);
                  return (
                    <ListItemButton
                      key={item.to}
                      component={RouterLink}
                      to={item.to}
                      selected={selected}
                      sx={{
                        borderRadius: 3,
                        mb: 0.75,
                        alignItems: "flex-start",
                        py: 1.1,
                        "&.Mui-selected": {
                          bgcolor: "rgba(15, 76, 92, 0.10)",
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
                        secondaryTypographyProps={{
                          sx: { lineHeight: 1.35 },
                        }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          ))}
        </Stack>
      </Box>

      <Divider />
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Stack spacing={1.25}>
          <Chip
            label={
              (session?.identity.roles ?? []).map(getRoleLabel).join(", ") ||
              "No roles"
            }
            color="secondary"
            variant="outlined"
            sx={{ justifyContent: "flex-start" }}
          />
          <Button
            component={RouterLink}
            to="/"
            color="inherit"
            endIcon={<LaunchRoundedIcon />}
          >
            Open public site
          </Button>
        </Stack>
      </Box>
    </Stack>
  );

  const notificationMenuContent =
    platformAdmin || latestNotifications.length === 0 ? (
      <MenuItem disabled>
        <ListItemText
          primary={
            platformAdmin
              ? "No platform notifications"
              : "No recent notifications"
          }
          secondary={
            platformAdmin
              ? "Notification delivery is focused on tenant and portal users today."
              : "New operational alerts will appear here."
          }
        />
      </MenuItem>
    ) : (
      latestNotifications.map((notification) => (
        <MenuItem
          key={notification.id}
          onClick={() => {
            setNotificationAnchorEl(null);
            navigate(notificationTarget);
          }}
          sx={{ alignItems: "flex-start", whiteSpace: "normal" }}
        >
          <ListItemText
            primary={notification.title}
            secondary={notification.message}
            primaryTypographyProps={{
              fontWeight: notification.readStatus === "UNREAD" ? 700 : 500,
            }}
            secondaryTypographyProps={{
              sx: {
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              },
            }}
          />
        </MenuItem>
      ))
    );

  const currentTitle = currentItem?.label ?? shellView.title;
  const currentDescription = currentItem?.description ?? shellView.description;

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
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="overline" color="secondary.main">
              {shellView.scopeLabel}
            </Typography>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              {workspaceLabel}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {shellView.description}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton
              color="inherit"
              onClick={(event) => setNotificationAnchorEl(event.currentTarget)}
            >
              <Badge
                color="secondary"
                badgeContent={platformAdmin ? 0 : unreadCount}
                max={99}
              >
                <NotificationsRoundedIcon />
              </Badge>
            </IconButton>
            <Chip
              label={
                capabilities?.subscriptionPlan?.name ??
                session?.identity.tenantId ??
                "Platform scope"
              }
              color="primary"
              variant="outlined"
            />
            <Button
              color="inherit"
              onClick={(event) => setUserMenuAnchorEl(event.currentTarget)}
              startIcon={
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                  {getInitials(displayName)}
                </Avatar>
              }
              endIcon={<MoreHorizRoundedIcon />}
            >
              {displayName}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={() => setNotificationAnchorEl(null)}
        PaperProps={{ sx: { width: 360, maxWidth: "calc(100vw - 24px)" } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1">Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {platformAdmin
              ? "Notification center placeholder for platform scope"
              : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
          </Typography>
        </Box>
        <Divider />
        {notificationMenuContent}
        <Divider />
        <MenuItem
          onClick={() => {
            setNotificationAnchorEl(null);
            navigate(notificationTarget);
          }}
        >
          View all notifications
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={userMenuAnchorEl}
        open={Boolean(userMenuAnchorEl)}
        onClose={() => setUserMenuAnchorEl(null)}
        PaperProps={{ sx: { width: 320, maxWidth: "calc(100vw - 24px)" } }}
      >
        <Box sx={{ px: 2, py: 1.75 }}>
          <Typography variant="subtitle1">{displayName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {session?.identity.email}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {workspaceLabel}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Chip
            label={
              (session?.identity.roles ?? []).map(getRoleLabel).join(", ") ||
              "No roles"
            }
            color="secondary"
            variant="outlined"
          />
        </Box>
        <Divider />
        <MenuItem
          component={RouterLink}
          to={workspaceHomePath}
          onClick={() => setUserMenuAnchorEl(null)}
        >
          Workspace home
        </MenuItem>
        {profilePath ? (
          <MenuItem
            component={RouterLink}
            to={profilePath}
            onClick={() => setUserMenuAnchorEl(null)}
          >
            {profilePath.includes("/settings")
              ? "Workspace settings"
              : "My profile"}
          </MenuItem>
        ) : null}
        <Divider />
        <MenuItem
          component={RouterLink}
          to="/"
          onClick={() => setUserMenuAnchorEl(null)}
        >
          View public site
        </MenuItem>
        <MenuItem
          component={RouterLink}
          to="/contact#request-demo"
          onClick={() => setUserMenuAnchorEl(null)}
        >
          Request demo
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setUserMenuAnchorEl(null);
            signOut();
            navigate("/login", { replace: true });
          }}
        >
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>

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
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Toolbar />
        <Container
          maxWidth={false}
          sx={{
            px: { xs: 2, md: 4 },
            py: { xs: 2, md: 3 },
            maxWidth: 1480,
            width: "100%",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box
            sx={{
              borderRadius: 5,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(14px)",
              px: { xs: 2.5, md: 3 },
              py: { xs: 2, md: 2.5 },
            }}
          >
            <Stack spacing={1.25}>
              <Breadcrumbs separator="/" aria-label="breadcrumb">
                <Link
                  component={RouterLink}
                  underline="hover"
                  color="inherit"
                  to={workspaceHomePath}
                >
                  {shellView.scopeLabel}
                </Link>
                <Typography color="text.primary">{currentTitle}</Typography>
              </Breadcrumbs>
              <Typography variant="h4">{currentTitle}</Typography>
              <Typography color="text.secondary">
                {currentDescription}
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Outlet />
          </Box>

          <Box
            component="footer"
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
              pt: 2,
              pb: 1,
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              justifyContent="space-between"
            >
              <Typography variant="body2" color="text.secondary">
                {branding?.displayName || "Transport Platform"} authenticated
                workspace for {workspaceLabel.toLowerCase()}.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Support:{" "}
                {branding?.supportEmail || "support@transportplatform.com"}
              </Typography>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
