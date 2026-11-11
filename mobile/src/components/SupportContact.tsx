import { Typography } from '@theme/tokens';
import { Alert, Linking, View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@auth/AuthContext';
import { runtimeApi } from '@api/runtimeApi';
import { AppButton } from './ui';
import { useBrandingColors } from '@theme/BrandingContext';
export function SupportContact() {
  const colors = useBrandingColors();
  const { session } = useAuth();
  const tenantId = session?.identity.tenantId;
  const { data } = useQuery({ queryKey: ['support', tenantId], queryFn: () => runtimeApi.getTenantBranding(tenantId!), enabled: !!tenantId, staleTime: 300000 });
  if (!data?.supportPhone && !data?.supportEmail) return null;
  const open = (url: string) => { void Linking.openURL(url).catch(() => Alert.alert('Unable to open contact', 'Use the contact details shown here.')); };
  return <View style={{ gap: 8 }}><Text style={{ fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizeMd, color: colors.textPrimary }}>Contact your transport provider</Text>
    {data.supportPhone ? <AppButton label={`Call ${data.supportPhone}`} variant="outlined" onPress={() => open(`tel:${data.supportPhone}`)} /> : null}
    {data.supportEmail ? <AppButton label={data.supportEmail} variant="outlined" onPress={() => open(`mailto:${data.supportEmail}`)} /> : null}
  </View>;
}
