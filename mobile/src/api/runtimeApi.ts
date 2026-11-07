import { apiClient, unwrapResponse } from './client';

export interface TenantBrandingRecord {
  tenantId: string;
  displayName: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  customFooterText: string | null;
}

export const runtimeApi = {
  async capabilities() { return unwrapResponse<{ operationalSettings: { timezone: string; currency: string } }>((await apiClient.get('/runtime/tenant-capabilities')).data); },
  async getTenantBranding(tenantId: string) {
    const r = await apiClient.get('/runtime/tenant-branding', {
      params: { tenantId },
    });
    return unwrapResponse<TenantBrandingRecord>(r.data);
  },
};
