import { RequestError } from '@components/RequestError';
import { useThemedStyles } from '@theme/ThemeProvider';
import type { BrandColors } from '@theme/branding';
import React from 'react';
import { StyleSheet, FlatList, View, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { AppBadge, AppCard } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Spacing, Typography } from '@theme/tokens';

export default function GuardianRidersPage() {
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['guardian-linked-riders'],
    queryFn: () => riderPortalApi.getLinkedRiders(),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <RequestError onRetry={() => void refetch()} />;

  const riders = data ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <SectionHeader title="Linked Riders" subtitle="Riders you're authorised to monitor" />
      </View>
      <FlatList
        data={riders}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <AppCard style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.riderDisplayName}</Text>
              <AppBadge status={item.status} />
            </View>
            <Text style={styles.code}>{item.riderCode}</Text>
            {item.relationshipType ? (
              <Text style={styles.meta}>Relationship: {item.relationshipType}</Text>
            ) : null}
            <View style={styles.tags}>
              {item.primaryGuardian && <Tag label="Primary Guardian" />}
              {item.authorizedForPickup && <Tag label="Authorised Pickup" />}
              {item.wheelchairRequired && <Tag label="Wheelchair" />}
              {item.escortRequired && <Tag label="Escort Required" />}
            </View>
          </AppCard>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={<EmptyState title="No linked riders" description="No riders are linked to your account." />}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={[
          riders.length === 0 ? styles.emptyContent : styles.listContent,
          {
            paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
            paddingBottom: Spacing.xxxl,
          },
        ]}
      />
    </View>
  );
}

function Tag({ label }: { label: string }) {
  const tagStyles = useThemedStyles(createTagStyles);
  return (
    <View style={tagStyles.tag}>
      <Text style={tagStyles.text}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: BrandColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerCard: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 0,
    backgroundColor: colors.primarySoft,
  },
  listContent: { paddingTop: Spacing.md },
  card: { gap: Spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: Typography.sizeLg, color: colors.textPrimary },
  code: { fontFamily: 'Manrope_500Medium', fontSize: Typography.sizeSm, color: colors.primary },
  meta: { fontFamily: 'Inter_400Regular', fontSize: Typography.sizeSm, color: colors.textSecondary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  sep: { height: Spacing.sm },
  emptyContent: { flex: 1 },
});

const createTagStyles = (colors: BrandColors) => StyleSheet.create({
  tag: { backgroundColor: colors.divider, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  text: { fontFamily: 'Inter_600SemiBold', fontSize: Typography.sizeXs, color: colors.textSecondary },
});
