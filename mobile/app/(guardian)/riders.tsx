import React from 'react';
import { StyleSheet, FlatList, View, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { AppBadge, AppCard } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { GuardianRoleTheme } from '@theme/roleTheme';

export default function GuardianRidersPage() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['guardian-linked-riders'],
    queryFn: () => riderPortalApi.getLinkedRiders(),
  });

  if (isLoading) return <LoadingState />;

  const riders = data ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <SectionHeader title="Live Tracking" subtitle="Riders you're authorised to monitor" />
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
  return (
    <View style={tagStyles.tag}>
      <Text style={tagStyles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerCard: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 0,
    backgroundColor: GuardianRoleTheme.soft,
  },
  listContent: { paddingTop: Spacing.md },
  card: { gap: Spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeLg, color: Colors.textPrimary },
  code: { fontFamily: 'SpaceGrotesk_500Medium', fontSize: Typography.sizeSm, color: GuardianRoleTheme.primary },
  meta: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  sep: { height: Spacing.sm },
  emptyContent: { flex: 1 },
});

const tagStyles = StyleSheet.create({
  tag: { backgroundColor: Colors.divider, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  text: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeXs, color: Colors.textSecondary },
});
