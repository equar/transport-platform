import { useEffect, useState } from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ContactPhoneRoundedIcon from "@mui/icons-material/ContactPhoneRounded";
import DriveEtaRoundedIcon from "@mui/icons-material/DriveEtaRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import AccessibleRoundedIcon from "@mui/icons-material/AccessibleRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import AutoAwesomeMotionRoundedIcon from "@mui/icons-material/AutoAwesomeMotionRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { getRoleLabel, isPlatformAdmin } from "../../features/auth/access";
import { useAuth } from "../../features/auth/context/AuthContext";
import {
  notificationApi,
  type NotificationSummaryRecord,
} from "../../features/notifications/api/notificationApi";
import { BrandMark } from "../../shared/components/BrandMark";

const drawerWidth = 280;

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<HTMLElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState<
    NotificationSummaryRecord[]
  >([]);
  const { session, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
          label: "Notifications",
          description: "Current-user inbox for operational and billing alerts",
          to: "/company/notifications",
          icon: <NotificationsRoundedIcon fontSize="small" />,
        },
        {
          label: "Notification Templates",
          description: "Tenant-managed rendering for in-app and email hooks",
          to: "/company/notification-templates",
          icon: <AutoAwesomeMotionRoundedIcon fontSize="small" />,
        },
        {
          label: "Compliance Center",
          description:
            "Issue tracking for expiring, missing, and rejected documents",
          to: "/company/compliance",
          icon: <FactCheckRoundedIcon fontSize="small" />,
        },
        {
          label: "Incident Management",
          description:
            "Complaint, safety, and operational issue workflow for company admins",
          to: "/company/incidents",
          icon: <ReportProblemRoundedIcon fontSize="small" />,
        },
        {
          label: "Company Reports",
          description:
            "Operational, billing, compliance, and incident reporting workspace",
          to: "/company/reports",
          icon: <AssessmentRoundedIcon fontSize="small" />,
        },
        {
          label: "Company Settings",
          description:
            "Tenant profile, policy, defaults, and branding controls",
          to: "/company/settings",
          icon: <SettingsRoundedIcon fontSize="small" />,
        },
        {
          label: "Rider Management",
          description:
            "Rider onboarding, support needs, and guardian visibility",
          to: "/company/riders",
          icon: <AccessibleRoundedIcon fontSize="small" />,
        },
        {
          label: "Ride Management",
          description:
            "One-off ride intake, lifecycle control, and scheduling readiness",
          to: "/company/rides",
          icon: <CalendarMonthRoundedIcon fontSize="small" />,
        },
        {
          label: "Dispatch Board",
          description:
            "Assignment coverage, exception handling, and day-of-service control",
          to: "/company/dispatch",
          icon: <DirectionsCarFilledRoundedIcon fontSize="small" />,
        },
        {
          label: "Route Management",
          description: "Route manifests, sequencing, and resource readiness",
          to: "/company/routes",
          icon: <RouteRoundedIcon fontSize="small" />,
        },
        {
          label: "Recurring Rides",
          description:
            "Recurring service templates and controlled ride generation",
          to: "/company/recurring-rides",
          icon: <RepeatRoundedIcon fontSize="small" />,
        },
        {
          label: "Guardian Management",
          description:
            "Family contacts, pickup authorization, and billing visibility",
          to: "/company/guardians",
          icon: <ContactPhoneRoundedIcon fontSize="small" />,
        },
        {
          label: "Driver Management",
          description: "Driver onboarding, readiness, and document control",
          to: "/company/drivers",
          icon: <DriveEtaRoundedIcon fontSize="small" />,
        },
        {
          label: "Vehicle Management",
          description: "Fleet readiness, lifecycle control, and compliance",
          to: "/company/vehicles",
          icon: <DirectionsCarFilledRoundedIcon fontSize="small" />,
        },
        {
          label: "Pricing Rules",
          description: "Rate policies, bill-to models, and service pricing",
          to: "/company/pricing-rules",
          icon: <AttachMoneyRoundedIcon fontSize="small" />,
        },
        {
          label: "Invoice Management",
          description: "Drafts, issuance, balances, and billing workflows",
          to: "/company/invoices",
          icon: <ReceiptLongRoundedIcon fontSize="small" />,
        },
        {
          label: "Payment Management",
          description:
            "Manual payment recording, application, and receivable collection traceability",
          to: "/company/payments",
          icon: <PaymentsRoundedIcon fontSize="small" />,
        },
        {
          label: "Receivables",
          description:
            "Aging exposure, overdue balances, and follow-up posture",
          to: "/company/receivables",
          icon: <AttachMoneyRoundedIcon fontSize="small" />,
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
    : "Company-admin workspace for rider, fleet, user, and tenant governance workflows.";
  const displayName = [session?.identity.firstName, session?.identity.lastName]
    .filter(Boolean)
    .join(" ");

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
            {!platformAdmin ? (
              <IconButton
                color="inherit"
                onClick={(event) =>
                  setNotificationAnchorEl(event.currentTarget)
                }
              >
                <Badge color="secondary" badgeContent={unreadCount} max={99}>
                  <NotificationsRoundedIcon />
                </Badge>
              </IconButton>
            ) : null}
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

      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={() => setNotificationAnchorEl(null)}
        PaperProps={{ sx: { width: 360, maxWidth: "calc(100vw - 24px)" } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1">Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </Typography>
        </Box>
        <Divider />
        {latestNotifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemText
              primary="No recent notifications"
              secondary="New operational alerts will appear here."
            />
          </MenuItem>
        ) : (
          latestNotifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => {
                setNotificationAnchorEl(null);
                navigate("/company/notifications");
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
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            setNotificationAnchorEl(null);
            navigate("/company/notifications");
          }}
        >
          View all notifications
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
