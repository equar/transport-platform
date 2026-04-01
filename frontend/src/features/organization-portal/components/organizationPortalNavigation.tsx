import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import ContactsRoundedIcon from "@mui/icons-material/ContactsRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import type { ReactNode } from "react";

export interface OrganizationPortalNavigationItem {
  label: string;
  description: string;
  to: string;
  icon: ReactNode;
}

export const organizationPortalNavigationItems: OrganizationPortalNavigationItem[] =
  [
    {
      label: "Dashboard",
      description:
        "Organization health, service activity, billing, and alerts.",
      to: "/portal/organization",
      icon: <ApartmentRoundedIcon fontSize="small" />,
    },
    {
      label: "Organization Profile",
      description: "Safe updates for the current organization contact profile.",
      to: "/portal/organization/profile",
      icon: <BadgeRoundedIcon fontSize="small" />,
    },
    {
      label: "Contacts",
      description: "Business contacts visible within your organization scope.",
      to: "/portal/organization/contacts",
      icon: <ContactsRoundedIcon fontSize="small" />,
    },
    {
      label: "Rider Roster",
      description: "Linked riders and support requirements for your roster.",
      to: "/portal/organization/roster",
      icon: <GroupsRoundedIcon fontSize="small" />,
    },
    {
      label: "Scheduled Rides",
      description: "Upcoming organization-scoped ride activity and schedules.",
      to: "/portal/organization/rides",
      icon: <CalendarMonthRoundedIcon fontSize="small" />,
    },
    {
      label: "Contracts",
      description: "Visible agreements and service terms for the organization.",
      to: "/portal/organization/contracts",
      icon: <ReceiptLongRoundedIcon fontSize="small" />,
    },
    {
      label: "Billing",
      description: "Invoice balances, payment history, and billing summary.",
      to: "/portal/organization/billing",
      icon: <AttachMoneyRoundedIcon fontSize="small" />,
    },
    {
      label: "Notifications",
      description: "Unread operational, billing, and account messages.",
      to: "/portal/organization/notifications",
      icon: <NotificationsRoundedIcon fontSize="small" />,
    },
  ];
