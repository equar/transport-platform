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
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import CircleIcon from "@mui/icons-material/Circle";
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
import { LoadingState } from "../../shared/components/LoadingState";

const drawerWidth = 276;

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
    <Stack sx={{ height: "100%", bgcolor: "#25313a", color: "#e8eef1", backgroundImage: "linear-gradient(180deg, #2f3c46 0%, #222d35 100%)" }}>
      <Box sx={{ px: 2.5, height: 72, display: "flex", alignItems: "center", bgcolor: "rgba(17,24,29,.42)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <BrandMark compact />
      </Box>
      <Box sx={{ mx: 1.5, my: 1.5, px: 1.75, py: 1.5, bgcolor: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 2.5, boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)" }}>
        <Typography variant="caption" sx={{ color: "#95a9b0", display: "block", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 800 }}>
          {shellView.scopeLabel}
        </Typography>
        <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, mt: .35 }} noWrap>
          {workspaceLabel}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1.5, py: 1 }}>
        <Stack spacing={1.75}>
          {visibleSections.map((section) => (
            <Box key={section.title}>
              <Typography
                variant="overline"
                sx={{ px: 1.4, pb: 0.9, display: "block", color: "#8da1aa", fontSize: ".66rem", letterSpacing: ".14em", lineHeight: 1.4 }}
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
                        mb: 0.4,
                        minHeight: 42,
                        py: 0.75,
                        px: 1.4,
                        color: "#c7d3d7",
                        borderRadius: 2,
                        border: "1px solid transparent",
                        "&.Mui-selected": {
                          bgcolor: "rgba(255,255,255,.11)",
                          color: "#fff",
                          borderColor: "rgba(255,255,255,.08)",
                          boxShadow: "inset 3px 0 0 #d6813f, 0 1px 2px rgba(0,0,0,.12)",
                        },
                        "&.Mui-selected:hover": { bgcolor: "rgba(255,255,255,.13)" },
                        "&:hover": { bgcolor: "rgba(255,255,255,.06)" },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 30,
                          color: selected ? "#6fd0df" : "#a8b0b4",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontWeight: selected ? 700 : 600,
                          fontSize: ".92rem",
                          color: "inherit",
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

      <Divider sx={{ borderColor: "rgba(255,255,255,.08)" }} />
      <Box sx={{ px: 1.6, py: 1.4 }}>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1 }}>
            <CircleIcon sx={{ fontSize: 8, color: "#5fc58b" }} />
            <Typography variant="caption" sx={{ color: "#9fb0b6" }}>System operational</Typography>
          </Stack>
          <Button
            component={RouterLink}
            to="/"
            sx={{ color: "#aebdc2", justifyContent: "flex-start", fontSize: ".75rem" }}
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
          backgroundColor: "rgba(248,251,253,.92)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 1px 0 rgba(255,255,255,.8), 0 10px 28px rgba(16,30,38,.05)",
        }}
      >
        <Toolbar sx={{ gap: 1.5, px: { xs: 1.5, md: 3 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ lineHeight: 1.1, fontWeight: 800, fontSize: "1.05rem" }} noWrap>
              {currentTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: { xs: "none", sm: "block" } }}>
              {workspaceLabel} / {shellView.scopeLabel}
            </Typography>
          </Box>
          <Stack direction="row" spacing={.75} alignItems="center">
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
              sx={{ display: { xs: "none", lg: "inline-flex" }, bgcolor: "rgba(37,76,99,.045)", borderRadius: 999 }}
            />
            <Button
              color="inherit"
              onClick={(event) => setUserMenuAnchorEl(event.currentTarget)}
              startIcon={
                <Avatar sx={{ width: 26, height: 26, bgcolor: "primary.main", fontSize: ".72rem" }}>
                  {getInitials(displayName)}
                </Avatar>
              }
              endIcon={<MoreHorizRoundedIcon />}
              sx={{ borderLeft: "1px solid", borderColor: "divider", borderRadius: 0, pl: 2, ml: .25, minWidth: 0 }}
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
              borderRadius: 0,
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
              backgroundColor: "#25313a",
              borderRadius: 0,
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
          minWidth: 0,
        }}
      >
        <Toolbar />
        <Container
          maxWidth={false}
          sx={{
            px: { xs: 1.25, md: 2.5 },
            py: { xs: 1.5, md: 2 },
            width: "100%",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box
            sx={{
              border: "1px solid",
              borderColor: "rgba(37,76,99,.1)",
              bgcolor: "rgba(255,255,255,.8)",
              px: 1.75,
              py: 1.2,
              borderRadius: 2.5,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.72), 0 4px 18px rgba(16,30,38,.025)",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={.5}>
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
              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: { sm: "55%" } }}>
                {currentDescription}
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <Suspense
              fallback={
                <LoadingState
                  title="Loading workspace"
                  description="Please wait while the selected workspace view is prepared."
                  minHeight={360}
                />
              }
            >
              <Outlet />
            </Suspense>
          </Box>

          <Box component="footer" sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.25, pb: .4 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              justifyContent="space-between"
            >
              <Typography variant="caption" color="text.secondary">
                {branding?.displayName || "Transport Platform"} authenticated
                workspace for {workspaceLabel.toLowerCase()}.
              </Typography>
              <Typography variant="caption" color="text.secondary">
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
