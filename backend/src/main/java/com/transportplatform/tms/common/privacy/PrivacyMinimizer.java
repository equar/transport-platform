package com.transportplatform.tms.common.privacy;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;

/** Unknown snapshot fields are redacted by default, including nested/free-text payloads. */
public final class PrivacyMinimizer {
  private static final Set<String> NUMBERS =
      Set.of(
          "amount",
          "paidAmount",
          "totalAmount",
          "subtotal",
          "taxAmount",
          "discountAmount",
          "quantity",
          "unitPrice",
          "lineAmount",
          "earningsRate",
          "billableAmount",
          "monthlyDriverRate",
          "driverCount",
          "tripCount",
          "riderCount",
          "version",
          "maxUsers",
          "maxDrivers",
          "maxVehicles",
          "maxRiders",
          "maxOrganizations",
          "paymentDueDays",
          "totalStops",
          "stopSequence",
          "operationalReviewDays",
          "auditDays",
          "notificationDays");
  private static final Set<String> TOKENS =
      Set.of(
          "status",
          "previousStatus",
          "newStatus",
          "entryType",
          "collectionMode",
          "collectionState",
          "currency",
          "enabled",
          "active",
          "trial",
          "isTrial",
          "platformManagedOnly",
          "enabledByDefault",
          "eventType",
          "channel",
          "readStatus",
          "deliveryStatus",
          "cleanupEnabled",
          "legalHold",
          "retentionReason");
  private static final Set<String> DATES =
      Set.of(
          "effectiveStartDate",
          "effectiveEndDate",
          "renewalDate",
          "trialEndDate",
          "periodStart",
          "periodEnd",
          "dueDate",
          "invoiceDate",
          "billingPeriodStart",
          "billingPeriodEnd");
  private static final Set<String> IDS =
      Set.of(
          "id",
          "tenantId",
          "driverId",
          "riderId",
          "guardianId",
          "rideId",
          "vehicleId",
          "routeId",
          "organizationId",
          "contractId",
          "invoiceId",
          "paymentId",
          "subscriptionId",
          "subscriptionPlanId",
          "entityId",
          "subjectId",
          "dropoffEvidenceId",
          "snapshotId",
          "userId",
          "recipientUserId");
  private static final Set<String> SENSITIVE =
      Set.of(
          "firstName",
          "lastName",
          "middleName",
          "name",
          "email",
          "phone",
          "primaryPhone",
          "alternatePhone",
          "dateOfBirth",
          "gender",
          "addressLine1",
          "addressLine2",
          "homeAddressLine1",
          "homeAddressLine2",
          "city",
          "state",
          "zipCode",
          "country",
          "defaultPickupAddress",
          "defaultDropoffAddress",
          "pickupAddress",
          "dropoffAddress",
          "pickupAddressLine1",
          "dropoffAddressLine1",
          "mobilityNeeds",
          "wheelchairRequired",
          "escortRequired",
          "specialInstructions",
          "careNotesSummary",
          "emergencyContactName",
          "emergencyContactPhone",
          "emergencyContactRelationship",
          "notes",
          "pickupNotes",
          "dropoffNotes",
          "internalNotes",
          "operationalNotes",
          "cancellationReason",
          "riderName",
          "guardianName",
          "description",
          "title",
          "message",
          "reason");

  private PrivacyMinimizer() {}

  public static JsonNode audit(JsonNode input) {
    if (input == null || input.isNull()) return NullNode.instance;
    if (!input.isObject()) return TextNode.valueOf("[REDACTED]");
    ObjectNode out = JsonNodeFactory.instance.objectNode();
    input
        .fields()
        .forEachRemaining(
            e -> {
              String k = e.getKey();
              JsonNode v = e.getValue();
              boolean id = IDS.contains(k);
              if (k.equals("changedFields") && v.isArray()) {
                ArrayNode fields = out.putArray(k);
                v.forEach(
                    name -> {
                      if (name.isTextual() && knownField(name.asText())) fields.add(name.asText());
                    });
              } else if (v.isNull()
                  && (IDS.contains(k)
                      || NUMBERS.contains(k)
                      || TOKENS.contains(k)
                      || DATES.contains(k)
                      || SENSITIVE.contains(k))) out.set(k, v);
              else if ((id
                      && (v.isIntegralNumber()
                          || (v.isTextual() && v.asText().matches("[A-Za-z0-9_-]{1,64}"))))
                  || (NUMBERS.contains(k) && v.isNumber())
                  || (TOKENS.contains(k)
                      && (v.isBoolean() || v.isTextual() && v.asText().matches("[A-Z0-9_]{1,60}")))
                  || (DATES.contains(k)
                      && v.isTextual()
                      && v.asText().matches("[0-9]{4}-[0-9]{2}-[0-9]{2}"))) out.set(k, v);
              else if (SENSITIVE.contains(k)) out.put(k, "[REDACTED]");
            });
    return out;
  }

  private static boolean knownField(String name) {
    return IDS.contains(name)
        || NUMBERS.contains(name)
        || TOKENS.contains(name)
        || DATES.contains(name)
        || SENSITIVE.contains(name);
  }

  public static JsonNode auditWithChanges(JsonNode oldValue, JsonNode newValue) {
    JsonNode safe = audit(newValue);
    if (!safe.isObject()) return safe;
    Set<String> changes = new TreeSet<>();
    if (safe.path("changedFields").isArray())
      safe.path("changedFields").forEach(n -> changes.add(n.asText()));
    Set<String> fields = new HashSet<>();
    if (oldValue != null && oldValue.isObject())
      oldValue.fieldNames().forEachRemaining(fields::add);
    if (newValue != null && newValue.isObject())
      newValue.fieldNames().forEachRemaining(fields::add);
    for (String name : fields)
      if (knownField(name)
          && !Objects.equals(
              oldValue == null ? null : oldValue.get(name),
              newValue == null ? null : newValue.get(name))) changes.add(name);
    ArrayNode changed = ((ObjectNode) safe).putArray("changedFields");
    changes.forEach(changed::add);
    return safe;
  }

  public static String auditNewJson(ObjectMapper mapper, String oldJson, String newJson) {
    if (newJson == null) return null;
    try {
      return mapper.writeValueAsString(
          auditWithChanges(
              oldJson == null ? null : mapper.readTree(oldJson), mapper.readTree(newJson)));
    } catch (Exception e) {
      return "{\"redacted\":true}";
    }
  }

  public static String auditJson(ObjectMapper mapper, String json) {
    if (json == null) return null;
    try {
      return mapper.writeValueAsString(audit(mapper.readTree(json)));
    } catch (Exception e) {
      return "{\"redacted\":true}";
    }
  }

  public static String summary(String entity, String action) {
    return token(entity) + " record: " + token(action) + ".";
  }

  private static String token(String s) {
    return s != null && s.matches("[A-Z0-9_]{1,80}") ? s : "EVENT";
  }

  public static Map<String, Object> notificationMetadata(Map<String, Object> values) {
    Map<String, Object> out = new LinkedHashMap<>();
    if (values != null)
      values.forEach(
          (k, v) -> {
            if ((k.equals("id") || k.endsWith("Id"))
                && (v instanceof Number || v instanceof String s && s.matches("[0-9a-fA-F-]{36}")))
              out.put(k, v);
          });
    return out;
  }

  public static boolean accountSetup(String type) {
    return Set.of("COMPANY_APPLICATION_APPROVED", "COMPANY_USER_CREATED").contains(type);
  }

  public static String notificationTitle(String type) {
    return type.startsWith("RIDE_") ? "Trip update" : "Account update";
  }

  public static final String NOTICE =
      "An update is available. Sign in to Bakaroo to review the details.";
}
