import React from 'react';
import { StyleSheet, FlatList, View, Text, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { riderPortalApi } from '@api/riderPortalApi';
import { AppBadge } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';

export default function GuardianRidersPage() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['guardian-linked-riders'],
    queryFn: () => riderPortalApi.getLinkedRiders(),
  });

  if (isLoading) return <LoadingState />;

  const riders = data ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SectionHeader title="Linked Riders" subtitle="Riders you're authorised to manage" />
      </View>
      <FlatList
        data={riders}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
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
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={<EmptyState title="No linked riders" description="No riders are linked to your account." />}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={riders.length === 0 && styles.emptyContent}
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
  header: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  card: { padding: Spacing.lg, gap: Spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeLg, color: Colors.textPrimary },
  code: { fontFamily: 'SpaceGrotesk_500Medium', fontSize: Typography.sizeSm, color: Colors.primary },
  meta: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  sep: { height: 1, backgroundColor: Colors.divider },
  emptyContent: { flex: 1 },
});

const tagStyles = StyleSheet.create({
  tag: { backgroundColor: Colors.divider, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  text: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeXs, color: Colors.textSecondary },
});
