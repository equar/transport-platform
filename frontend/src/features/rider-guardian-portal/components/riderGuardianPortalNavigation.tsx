import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import type { ReactNode } from "react";

export interface RiderGuardianPortalNavigationItem {
  label: string;
  description: string;
  to: string;
  icon: ReactNode;
}

export const riderGuardianPortalNavigationItems: RiderGuardianPortalNavigationItem[] =
  [
    {
      label: "Dashboard",
      description: "Upcoming rides, recurring schedules, billing, and alerts.",
      to: "/portal/rider",
      icon: <DashboardRoundedIcon fontSize="small" />,
    },
    {
      label: "My Profile / My Riders",
      description:
        "Contact details and linked rider visibility for the current scope.",
      to: "/portal/rider/profile",
      icon: <BadgeRoundedIcon fontSize="small" />,
    },
    {
      label: "Upcoming Rides",
      description: "Scheduled trips that still need attention.",
      to: "/portal/rider/rides",
      icon: <CalendarMonthRoundedIcon fontSize="small" />,
    },
    {
      label: "Ride History",
      description: "Completed, cancelled, and past rides in your scope.",
      to: "/portal/rider/rides/history",
      icon: <HistoryRoundedIcon fontSize="small" />,
    },
    {
      label: "Billing",
      description: "Invoices, outstanding balance, and payment history.",
      to: "/portal/rider/billing",
      icon: <AttachMoneyRoundedIcon fontSize="small" />,
    },
    {
      label: "Notifications",
      description: "Account and ride-related alerts for the portal user.",
      to: "/portal/rider/notifications",
      icon: <NotificationsRoundedIcon fontSize="small" />,
    },
  ];
