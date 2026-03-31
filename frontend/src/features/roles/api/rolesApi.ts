import { apiClient, unwrapResponse } from "../../../shared/api/client";

export interface RoleCatalogItem {
  name: string;
  displayName: string;
  description: string;
  scope: string;
  assignable: boolean;
  userCount: number;
}

export const rolesApi = {
  async list(scope: "platform" | "company") {
    const response = await apiClient.get(`/${scope}/roles`);
    return unwrapResponse<RoleCatalogItem[]>(response.data);
  },
};