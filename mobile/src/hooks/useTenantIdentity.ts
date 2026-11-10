import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { runtimeApi, type TenantBrandingRecord } from '@api/runtimeApi';
import { getCachedTenantBranding, setCachedTenantBranding } from '@auth/sessionStorage';

// Tenant identity is shared with the portal. Its palette never controls mobile styling.
export function useTenantIdentity(tenantId: string | null | undefined) {
  const [cached, setCached] = useState<{ owner: string; value: TenantBrandingRecord } | null>(null);
  const { data, refetch } = useQuery({
    queryKey: ['tenant-branding', tenantId],
    queryFn: () => runtimeApi.getTenantBranding(tenantId!),
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  useEffect(() => {
    let active = true;
    setCached(null);
    if (tenantId) void getCachedTenantBranding(tenantId).then(raw => {
      if (!active || !raw) return;
      try { setCached({ owner: tenantId, value: JSON.parse(raw) as TenantBrandingRecord }); }
      catch { /* An invalid cache must not hide a fresh server identity. */ }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [tenantId]);
  useEffect(() => {
    if (tenantId && data) void setCachedTenantBranding(tenantId, JSON.stringify(data)).catch(() => undefined);
  }, [tenantId, data]);
  useEffect(() => {
    if (!tenantId) return;
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refetch(); });
    return () => listener.remove();
  }, [tenantId, refetch]);
  return tenantId ? data ?? (cached?.owner === tenantId ? cached.value : null) : null;
}
