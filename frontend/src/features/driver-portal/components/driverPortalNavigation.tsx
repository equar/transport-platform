import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import type { ReactNode } from "react";

export interface DriverPortalNavigationItem {
  label: string;
  description: string;
  to: string;
  icon: ReactNode;
}

export const driverPortalNavigationItems: DriverPortalNavigationItem[] = [
  {
    label: "Dashboard",
    description: "Today’s rides, route readiness, and urgent actions.",
    to: "/portal/driver",
    icon: <DashboardRoundedIcon fontSize="small" />,
  },
  {
    label: "My Profile",
    description: "Contact details, emergency contact, and availability.",
    to: "/portal/driver/profile",
    icon: <BadgeRoundedIcon fontSize="small" />,
  },
  {
    label: "My Rides",
    description: "Assigned trips, pickup times, and ride status updates.",
    to: "/portal/driver/rides",
    icon: <CalendarMonthRoundedIcon fontSize="small" />,
  },
  {
    label: "My Routes",
    description: "Route manifests, stops, and route progress.",
    to: "/portal/driver/routes",
    icon: <RouteRoundedIcon fontSize="small" />,
  },
  {
    label: "My Compliance",
    description: "Document status, expirations, and open issues.",
    to: "/portal/driver/compliance",
    icon: <FactCheckRoundedIcon fontSize="small" />,
  },
  {
    label: "My Notifications",
    description: "Unread operational alerts and account messages.",
    to: "/portal/driver/notifications",
    icon: <NotificationsRoundedIcon fontSize="small" />,
  },
];
