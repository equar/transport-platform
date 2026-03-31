import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS_READY" | "WHATSAPP_READY";
export type NotificationReadStatus = "UNREAD" | "READ";
export type NotificationDeliveryStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";
export type NotificationStatus = "ACTIVE" | "ARCHIVED";
export type NotificationTemplateStatus = "DRAFT" | "ACTIVE" | "INACTIVE";
export type NotificationType =
  | "COMPANY_APPLICATION_SUBMITTED"
  | "COMPANY_APPLICATION_APPROVED"
  | "COMPANY_APPLICATION_REJECTED"
  | "COMPANY_USER_CREATED"
  | "COMPANY_USER_ACTIVATED"
  | "COMPANY_USER_SUSPENDED"
  | "DRIVER_STATUS_CHANGED"
  | "DRIVER_DOCUMENT_VERIFIED"
  | "DRIVER_DOCUMENT_REJECTED"
  | "DRIVER_DOCUMENT_EXPIRING"
  | "DRIVER_DOCUMENT_EXPIRED"
  | "VEHICLE_DOCUMENT_VERIFIED"
  | "VEHICLE_DOCUMENT_REJECTED"
  | "VEHICLE_DOCUMENT_EXPIRING"
  | "VEHICLE_DOCUMENT_EXPIRED"
  | "RIDE_DRIVER_ASSIGNED"
  | "RIDE_VEHICLE_ASSIGNED"
  | "RIDE_STATUS_CHANGED"
  | "INVOICE_ISSUED"
  | "PAYMENT_RECORDED"
  | "PAYMENT_APPLIED"
  | "RECEIVABLE_OVERDUE_REMINDER"
  | "COMPLIANCE_ISSUE_OPENED";

export interface NotificationSummaryRecord {
  id: number;
  notificationCode: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  channel: NotificationChannel;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  deliveryStatus: NotificationDeliveryStatus;
  readStatus: NotificationReadStatus;
  sentAt: string | null;
  readAt: string | null;
  status: NotificationStatus;
  createdAt: string;
}

export interface NotificationDetailRecord extends NotificationSummaryRecord {
  tenantId: string;
  recipientUserId: number;
  errorMessage: string | null;
  metadataJson: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface NotificationUnreadCountRecord {
  unreadCount: number;
}

export interface NotificationMarkAllReadRecord {
  updatedCount: number;
}

export interface NotificationTemplateRecord {
  id: number;
  tenantId: string;
  templateCode: string;
  name: string;
  eventType: NotificationType;
  channel: NotificationChannel;
  subjectTemplate: string | null;
  titleTemplate: string | null;
  bodyTemplate: string;
  description: string | null;
  isDefault: boolean;
  status: NotificationTemplateStatus;
  createdBy: string | null;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface NotificationTemplatePayload {
  name: string;
  eventType: NotificationType;
  channel: NotificationChannel;
  subjectTemplate?: string | null;
  titleTemplate?: string | null;
  bodyTemplate: string;
  description?: string | null;
  isDefault?: boolean;
}

export const notificationTemplateStatusOptions: NotificationTemplateStatus[] = ["DRAFT", "ACTIVE", "INACTIVE"];
export const notificationChannelOptions: NotificationChannel[] = ["IN_APP", "EMAIL"];
export const notificationTypeOptions: NotificationType[] = [
  "COMPANY_APPLICATION_SUBMITTED",
  "COMPANY_APPLICATION_APPROVED",
  "COMPANY_APPLICATION_REJECTED",
  "COMPANY_USER_CREATED",
  "COMPANY_USER_ACTIVATED",
  "COMPANY_USER_SUSPENDED",
  "DRIVER_STATUS_CHANGED",
  "DRIVER_DOCUMENT_VERIFIED",
  "DRIVER_DOCUMENT_REJECTED",
  "DRIVER_DOCUMENT_EXPIRING",
  "DRIVER_DOCUMENT_EXPIRED",
  "VEHICLE_DOCUMENT_VERIFIED",
  "VEHICLE_DOCUMENT_REJECTED",
  "VEHICLE_DOCUMENT_EXPIRING",
  "VEHICLE_DOCUMENT_EXPIRED",
  "RIDE_DRIVER_ASSIGNED",
  "RIDE_VEHICLE_ASSIGNED",
  "RIDE_STATUS_CHANGED",
  "INVOICE_ISSUED",
  "PAYMENT_RECORDED",
  "PAYMENT_APPLIED",
  "RECEIVABLE_OVERDUE_REMINDER",
  "COMPLIANCE_ISSUE_OPENED",
];

export const notificationApi = {
  async searchNotifications(params: Record<string, unknown>) {
    const response = await apiClient.get("/notifications", { params });
    return unwrapResponse<PageResponse<NotificationSummaryRecord>>(response.data);
  },
  async getLatestNotifications(limit = 5) {
    const response = await apiClient.get("/notifications/latest", { params: { limit } });
    return unwrapResponse<NotificationSummaryRecord[]>(response.data);
  },
  async getUnreadCount() {
    const response = await apiClient.get("/notifications/unread-count");
    return unwrapResponse<NotificationUnreadCountRecord>(response.data);
  },
  async getNotification(notificationId: number) {
    const response = await apiClient.get(`/notifications/${notificationId}`);
    return unwrapResponse<NotificationDetailRecord>(response.data);
  },
  async markRead(notificationId: number) {
    const response = await apiClient.post(`/notifications/${notificationId}/read`);
    return unwrapResponse<NotificationDetailRecord>(response.data);
  },
  async markUnread(notificationId: number) {
    const response = await apiClient.post(`/notifications/${notificationId}/unread`);
    return unwrapResponse<NotificationDetailRecord>(response.data);
  },
  async markAllRead() {
    const response = await apiClient.post("/notifications/read-all");
    return unwrapResponse<NotificationMarkAllReadRecord>(response.data);
  },
  async searchTemplates(params: Record<string, unknown>) {
    const response = await apiClient.get("/company/notification-templates", { params });
    return unwrapResponse<PageResponse<NotificationTemplateRecord>>(response.data);
  },
  async createTemplate(payload: NotificationTemplatePayload) {
    const response = await apiClient.post("/company/notification-templates", payload);
    return unwrapResponse<NotificationTemplateRecord>(response.data);
  },
  async updateTemplate(templateId: number, payload: NotificationTemplatePayload) {
    const response = await apiClient.put(`/company/notification-templates/${templateId}`, payload);
    return unwrapResponse<NotificationTemplateRecord>(response.data);
  },
  async activateTemplate(templateId: number) {
    const response = await apiClient.post(`/company/notification-templates/${templateId}/activate`);
    return unwrapResponse<NotificationTemplateRecord>(response.data);
  },
  async deactivateTemplate(templateId: number) {
    const response = await apiClient.post(`/company/notification-templates/${templateId}/deactivate`);
    return unwrapResponse<NotificationTemplateRecord>(response.data);
  },
};