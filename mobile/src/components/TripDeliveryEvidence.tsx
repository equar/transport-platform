import React from "react";
import { View, Text, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tripEvidenceApi } from "@api/tripEvidenceApi";
import { AppButton } from "@components/ui";
import {
  useTripScreenVisible,
  manualTripRefreshOptions,
} from "@hooks/useTripScreenVisible";
import { useBrandingColors } from "@theme/BrandingContext";
export function TripDeliveryEvidence({
  rideId,
  status,
  driver = false,
  destination,
  onReadinessChange,
}: {
  rideId: number;
  status: string;
  driver?: boolean;
  destination?: string;
  onReadinessChange?: (ready: boolean) => void;
}) {
  const colors = useBrandingColors(),
    visible = useTripScreenVisible(),
    qc = useQueryClient();
  const query = useQuery({
    queryKey: ["trip-delivery-evidence", rideId, driver, status],
    queryFn: () => tripEvidenceApi.get(rideId, driver),
    enabled: visible,
    ...manualTripRefreshOptions,
  });
  React.useEffect(() => {
    onReadinessChange?.(!query.isError && query.data?.readyToComplete === true);
  }, [query.isError, query.data?.readyToComplete, onReadinessChange]);
  const confirmation = useMutation({
    mutationFn: (id: number) => tripEvidenceApi.confirm(rideId, id),
    onSuccess: () => {
      void query.refetch();
      void qc.invalidateQueries({ queryKey: ["driver-ride"] });
    },
    onError: (e: Error) => Alert.alert("Delivery not confirmed", e.message),
  });
  const evidence = query.data,
    dropoff = evidence?.milestones
      .filter((m) => m.milestone === "DROPPED_OFF" && m.consumedAt)
      .slice(-1)[0];
  return (
    <View
      style={{
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        backgroundColor: colors.surface,
      }}
    >
      <Text
        style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}
      >
        Delivery verification
      </Text>
      {query.isPending ? (
        <Text style={{ color: colors.textPrimary }}>
          Loading delivery evidence…
        </Text>
      ) : query.isError ? (
        <Text style={{ color: colors.textPrimary }}>
          Delivery evidence is unavailable. Refresh to retry or contact
          dispatch.
        </Text>
      ) : (
        <>
          {driver && !evidence?.stops ? (
            <Text style={{ color: colors.textPrimary }}>
              Dispatch must verify pickup and drop-off map coordinates before
              departure.
            </Text>
          ) : null}
          {evidence?.confirmation ? (
            <Text style={{ color: colors.textPrimary }}>
              Delivery confirmed by {evidence.confirmation.confirmerName} (
              {evidence.confirmation.subjectType.toLowerCase()}).
            </Text>
          ) : (
            <Text style={{ color: colors.textPrimary }}>
              {driver
                ? "Completion requires the rider or an authorized guardian to confirm delivery in their own app."
                : "Confirm only after the rider has arrived safely at the booked destination."}
            </Text>
          )}
          {destination ? (
            <Text style={{ color: colors.textPrimary }}>
              Booked destination: {destination}
            </Text>
          ) : null}
          {!driver && evidence?.canConfirm && dropoff ? (
            <AppButton
              label="Confirm rider was delivered"
              loading={confirmation.isPending}
              disabled={confirmation.isPending}
              onPress={() =>
                Alert.alert(
                  "Confirm delivery",
                  `Has the rider arrived safely at ${destination || "the booked destination"}? Confirm only if you know this delivery occurred.`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Yes, confirm delivery",
                      onPress: () => confirmation.mutate(dropoff.id),
                    },
                  ],
                )
              }
            />
          ) : null}
          {driver && status === "DROPPED_OFF" && !evidence?.confirmation ? (
            <Text style={{ color: colors.textPrimary }}>
              Awaiting delivery confirmation. Ask the rider or guardian to open
              this trip, then refresh here.
            </Text>
          ) : null}
        </>
      )}
      <AppButton
        label="Refresh delivery evidence"
        variant="secondary"
        loading={query.isFetching}
        onPress={() => void query.refetch()}
      />
    </View>
  );
}
