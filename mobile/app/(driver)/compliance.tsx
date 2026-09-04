import React from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { driverPortalApi } from '@api/driverPortalApi';
import { AppBadge } from '@components/ui';
import { LoadingState } from '@components/LoadingState';
import { SectionHeader } from '@components/SectionHeader';
import { MetricTile } from '@components/MetricTile';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { formatDate } from '@utils/formatDate';

export default function DriverCompliancePage() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-compliance'],
    queryFn: () => driverPortalApi.getComplianceSummary(),
  });

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
          gap: isCompact ? Spacing.md : Spacing.lg,
        },
      ]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <SectionHeader title="Compliance" subtitle="Documents and issues" />

      <View style={[styles.metricRow, isCompact && styles.metricRowCompact]}>
        <MetricTile
          label="Open Issues"
          value={data?.unresolvedComplianceIssues ?? 0}
          warning={(data?.unresolvedComplianceIssues ?? 0) > 0}
        />
        <MetricTile
          label="Expiring Soon"
          value={data?.expiringDocumentsSoon ?? 0}
          warning={(data?.expiringDocumentsSoon ?? 0) > 0}
        />
      </View>

      {(data?.issues ?? []).length > 0 && (
        <>
          <Text style={styles.groupHeading}>Open Issues</Text>
          {data?.issues.map((issue) => (
            <View key={issue.id} style={styles.issueCard}>
              <View style={styles.row}>
                <AppBadge status={issue.issueStatus} />
                <AppBadge status={issue.severity} />
              </View>
              <Text style={styles.summary}>{issue.summary}</Text>
              {issue.recommendedAction ? (
                <Text style={styles.action}>{issue.recommendedAction}</Text>
              ) : null}
              {issue.expiryDate ? (
                <Text style={styles.expiry}>Expires: {formatDate(issue.expiryDate)}</Text>
              ) : null}
            </View>
          ))}
        </>
      )}

      {(data?.documents ?? []).length > 0 && (
        <>
          <Text style={styles.groupHeading}>Documents</Text>
          {data?.documents.map((doc) => (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.row}>
                <Text style={styles.docType}>{doc.documentType.replace(/_/g, ' ')}</Text>
                <AppBadge status={doc.verificationStatus} />
              </View>
              <Text style={styles.docName}>{doc.fileName}</Text>
              {doc.expiryDate ? (
                <Text style={styles.expiry}>Expires: {formatDate(doc.expiryDate)}</Text>
              ) : null}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  metricRow: { flexDirection: 'row', gap: Spacing.sm },
  metricRowCompact: { flexDirection: 'column' },
  groupHeading: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: Typography.sizeLg,
    color: Colors.textPrimary,
    marginBottom: -Spacing.xs,
  },
  issueCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  summary: { fontFamily: 'SourceSans3_600SemiBold', fontSize: Typography.sizeMd, color: Colors.textPrimary },
  action: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
  expiry: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.warning },
  docCard: { borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.xs },
  docType: { fontFamily: 'SourceSans3_700Bold', fontSize: Typography.sizeSm, color: Colors.textPrimary, flex: 1 },
  docName: { fontFamily: 'SourceSans3_400Regular', fontSize: Typography.sizeSm, color: Colors.textSecondary },
});
