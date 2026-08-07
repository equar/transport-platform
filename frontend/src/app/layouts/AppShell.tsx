import { Suspense, useEffect, useState } from "react";
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
  Skeleton,
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

const drawerWidth = 252;
const appBarHeight = 72;

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
  }, [platformAdmin, session?.accessToken]);

  const drawer = (
    <Stack sx={{ height: "100%" }}>
      <Box sx={{ px: 2.5, py: 2, color: "white" }}>
        <BrandMark compact />
      </Box>
      <Divider />
      <Box sx={{ px: 2.5, py: 1.5 }}>
        <Typography variant="overline" sx={{ color: "rgba(255,255,255,.48)" }}>
          {shellView.scopeLabel}
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,.78)" }}>
          {workspaceLabel}
        </Typography>
      </Box>
      <Divider />

      <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1.25, py: 1.5 }}>
        <Stack spacing={1.5}>
          {visibleSections.map((section) => (
            <Box key={section.title}>
              <Typography
                variant="overline"
                sx={{ px: 1.25, pb: 0.5, display: "block", color: "rgba(255,255,255,.42)" }}
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
                        mb: 0.25,
                        minHeight: 44,
                        borderRadius: 1.5,
                        alignItems: "center",
                        py: 0.75,
                        px: 1.25,
                        "&.Mui-selected": {
                          bgcolor: "rgba(255,255,255,.12)",
                          boxShadow: "inset 3px 0 0 #e18a48",
                        },
                        "&:hover": { bgcolor: "rgba(255,255,255,.075)" },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: selected ? "#f1a768" : "rgba(255,255,255,.48)",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontWeight: selected ? 700 : 600,
                          color: "common.white",
                          fontSize: "0.94rem",
                          lineHeight: 1.25,
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
      <Box sx={{ px: 2.5, py: 2.5, color: "white", "& .MuiButton-root": { color: "rgba(255,255,255,.72)" }, "& .MuiChip-root": { color: "white", borderColor: "rgba(255,255,255,.22)" } }}>
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
          backgroundColor: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(18px)",
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: `${appBarHeight}px !important` }}>
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
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
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
              sx={{ display: { xs: "none", lg: "flex" } }}
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
              sx={{ minWidth: 0, "& .MuiButton-startIcon": { mr: { xs: 0, sm: 1 } } }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>{displayName}</Box>
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
              ? "Notifications are available for company and portal workspaces."
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
        {!platformAdmin ? (
          <>
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
              Request a demo
            </MenuItem>
          </>
        ) : null}
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
              color: "common.white",
              background: "radial-gradient(circle at 0 0, #174e5b 0, transparent 28%), linear-gradient(180deg, #0a2932 0%, #071e25 100%)",
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
              borderColor: "rgba(255,255,255,.06)",
              color: "common.white",
              background: "radial-gradient(circle at 0 0, #174e5b 0, transparent 28%), linear-gradient(180deg, #0a2932 0%, #071e25 100%)",
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
          backgroundImage: "radial-gradient(rgba(15,76,92,.075) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <Toolbar sx={{ minHeight: `${appBarHeight}px !important` }} />
        <Container
          maxWidth={false}
          sx={{
            px: { xs: 2, md: 4 },
            py: { xs: 2.5, md: 4 },
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
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "rgba(255,255,255,.72)",
              backdropFilter: "blur(12px)",
              borderRadius: 2,
              px: { xs: 2.5, md: 3 },
              py: { xs: 2, md: 2.25 },
              boxShadow: "0 12px 30px rgba(15,50,60,.06)",
            }}
          >
            <Stack spacing={0.75}>
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
              <Typography variant="body2" color="text.secondary">
                {currentDescription}
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Suspense
              fallback={
                <Box
                  aria-label="Loading workspace"
                  aria-busy="true"
                  sx={{ minHeight: 360, pt: 0.5 }}
                >
                  <Skeleton variant="rounded" height={180} animation={false} />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                    <Skeleton variant="rounded" height={112} sx={{ flex: 1 }} animation={false} />
                    <Skeleton variant="rounded" height={112} sx={{ flex: 1 }} animation={false} />
                    <Skeleton variant="rounded" height={112} sx={{ flex: 1 }} animation={false} />
                  </Stack>
                </Box>
              }
            >
              <Outlet />
            </Suspense>
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
