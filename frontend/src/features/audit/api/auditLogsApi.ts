import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export interface AuditLogRecord {
  id: number;
  actorUserId: number | null;
  actorName: string | null;
  actorEmail: string | null;
  tenantId: string | null;
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  oldValueJson: string | null;
  newValueJson: string | null;
  createdAt: string;
}

export interface AuditLogSearchParams {
  keyword: string;
  module: string;
  action: string;
  createdFrom: string;
  createdTo: string;
  page: number;
  size: number;
}

export const auditLogsApi = {
  async search(params: AuditLogSearchParams) {
    const response = await apiClient.get("/audit-logs", {
      params: {
        keyword: params.keyword || undefined,
        module: params.module || undefined,
        action: params.action || undefined,
        createdFrom: params.createdFrom || undefined,
        createdTo: params.createdTo || undefined,
        page: params.page,
        size: params.size,
      },
    });
    return unwrapResponse<PageResponse<AuditLogRecord>>(response.data);
  },
};