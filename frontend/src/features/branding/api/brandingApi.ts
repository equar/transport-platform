import { apiClient, unwrapResponse } from '../../../shared/api/client';
export interface ThemePreset {
  code: string; name: string; description: string;
  primaryColor: string; secondaryColor: string; accentColor: string;
}
export interface TenantThemeState {
  tenantId: string; companyName: string; selectedCode: string; eligible: boolean;
  eligibilityMessage: string | null; themes: ThemePreset[];
}
function endpoint(tenantId?: string) {
  return tenantId ? `/platform/tenants/${encodeURIComponent(tenantId)}/branding-theme` : '/company/branding-theme';
}
export const brandingApi = {
  async get(tenantId?: string) { return unwrapResponse<TenantThemeState>((await apiClient.get(endpoint(tenantId))).data); },
  async apply(themeCode: string, tenantId?: string) {
    return unwrapResponse<TenantThemeState>((await apiClient.put(endpoint(tenantId), { themeCode })).data);
  },
};
