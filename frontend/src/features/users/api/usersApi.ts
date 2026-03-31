import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type { PageResponse } from "../../../shared/api/types";

export type UserScope = "platform" | "company";

export interface UserRecord {
  id: number;
  tenantId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  roles: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSearchParams {
  keyword: string;
  status: string;
  role: string;
  tenantId?: string;
  page: number;
  size: number;
}

export interface UserUpsertPayload {
  tenantId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  status: string;
  roles: string[];
}

function buildBasePath(scope: UserScope) {
  return `/${scope}/users`;
}

export const usersApi = {
  async search(scope: UserScope, params: UserSearchParams) {
    const response = await apiClient.get(buildBasePath(scope), {
      params: {
        keyword: params.keyword || undefined,
        status: params.status || undefined,
        role: params.role || undefined,
        tenantId: scope === "platform" ? params.tenantId || undefined : undefined,
        page: params.page,
        size: params.size,
      },
    });
    return unwrapResponse<PageResponse<UserRecord>>(response.data);
  },
  async create(scope: UserScope, payload: UserUpsertPayload) {
    const response = await apiClient.post(buildBasePath(scope), payload);
    return unwrapResponse<UserRecord>(response.data);
  },
  async update(scope: UserScope, userId: number, payload: UserUpsertPayload) {
    const response = await apiClient.put(`${buildBasePath(scope)}/${userId}`, payload);
    return unwrapResponse<UserRecord>(response.data);
  },
  async activate(scope: UserScope, userId: number) {
    const response = await apiClient.post(`${buildBasePath(scope)}/${userId}/activate`);
    return unwrapResponse<UserRecord>(response.data);
  },
  async suspend(scope: UserScope, userId: number) {
    const response = await apiClient.post(`${buildBasePath(scope)}/${userId}/suspend`);
    return unwrapResponse<UserRecord>(response.data);
  },
  async deactivate(scope: UserScope, userId: number) {
    const response = await apiClient.post(`${buildBasePath(scope)}/${userId}/deactivate`);
    return unwrapResponse<UserRecord>(response.data);
  },
};