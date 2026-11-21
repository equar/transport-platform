package com.transportplatform.tms.features.tripevidence.application;

import static com.transportplatform.tms.features.tripevidence.api.TripEvidenceRecords.*;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.*;
import com.transportplatform.tms.features.driverportal.application.DriverPortalAccessService;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.ride.application.RideAccessService;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.riderguardianportal.application.RiderGuardianPortalAccessService;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TripEvidenceService {
  private final com.transportplatform.tms.common.privacy.PhiCipher privacy;
  private final JdbcTemplate db;
  private final Clock clock;
  private final RideAccessService company;
  private final DriverPortalAccessService driver;
  private final RiderGuardianPortalAccessService passenger;
  private final RideRepository rides;
  private final CurrentAuthenticatedUserService users;
  private final AuditLogService audit;

  public TripEvidenceService(
      JdbcTemplate db,
      Clock clock,
      RideAccessService company,
      DriverPortalAccessService driver,
      RiderGuardianPortalAccessService passenger,
      RideRepository rides,
      CurrentAuthenticatedUserService users,
      AuditLogService audit, com.transportplatform.tms.common.privacy.PhiCipher privacy) {
    this.privacy=privacy;
    this.db = db;
    this.clock = clock;
    this.company = company;
    this.driver = driver;
    this.passenger = passenger;
    this.rides = rides;
    this.users = users;
    this.audit = audit;
  }

  private double coordinate(Object value){return Double.parseDouble(privacy.decrypt(value.toString(),"coordinate"));}
  private ApiException invalid(String message) {
    return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
  }

  private ApiException forbidden() {
    return new ApiException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        "This account cannot confirm delivery for this ride.");
  }

  private LocalDateTime now() {
    return LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
  }

  private Instant epoch(Object value) {
    var seconds = new BigDecimal(value.toString());
    return Instant.ofEpochMilli(seconds.multiply(BigDecimal.valueOf(1000)).longValue());
  }

  private String hash(Ride r) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256")
                  .digest(
                      String.join(
                              "|",
                              String.valueOf(r.getRider().getId()),
                              String.valueOf(r.getPickupAddressLine1()),
                              String.valueOf(r.getPickupAddressLine2()),
                              String.valueOf(r.getPickupCity()),
                              String.valueOf(r.getPickupState()),
                              String.valueOf(r.getPickupZipCode()),
                              String.valueOf(r.getPickupCountry()),
                              String.valueOf(r.getDropoffAddressLine1()),
                              String.valueOf(r.getDropoffAddressLine2()),
                              String.valueOf(r.getDropoffCity()),
                              String.valueOf(r.getDropoffState()),
                              String.valueOf(r.getDropoffZipCode()),
                              String.valueOf(r.getDropoffCountry()))
                          .getBytes(StandardCharsets.UTF_8)));
    } catch (java.security.NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  private void lock(Ride r) {
    db.queryForList(
        "SELECT id FROM rides WHERE id=? AND tenant_id=? FOR UPDATE", r.getId(), r.getTenantId());
  }

  private Map<String, Object> stops(Ride r) {
    var rows =
        db.queryForList(
            "SELECT * FROM trip_verified_stops WHERE ride_id=? AND tenant_id=?",
            r.getId(),
            r.getTenantId());
    if (rows.isEmpty() || !hash(r).equals(rows.getFirst().get("address_hash")))
      throw invalid(
          "Dispatch must verify the pickup and drop-off map coordinates for the current addresses"
              + " before departure.");
    return rows.getFirst();
  }

  @Transactional
  public Summary configure(long id, Stops request) {
    Ride r = company.findRideForCompanyScope(id);
    lock(r);
    if (!Set.of(
                RideStatus.DRAFT,
                RideStatus.REQUESTED,
                RideStatus.PENDING_REVIEW,
                RideStatus.SCHEDULED,
                RideStatus.ASSIGNED,
                RideStatus.DRIVER_EN_ROUTE)
            .contains(r.getStatus())
        || !db.queryForList("SELECT id FROM trip_milestone_evidence WHERE ride_id=? LIMIT 1", id)
            .isEmpty())
      throw invalid(
          "Verified stops cannot change after milestone evidence is captured. Cancel and rebook an"
              + " incorrect journey.");
    for (double n : new double[]{request.pickupLatitude(),request.pickupLongitude(),request.dropoffLatitude(),request.dropoffLongitude()}) if (!Double.isFinite(n)) throw invalid("Stop coordinates must be finite.");
    var old = db.queryForList("SELECT * FROM trip_verified_stops WHERE ride_id=?", id);
    db.update(
        "INSERT INTO"
            + " trip_verified_stops(ride_id,tenant_id,address_hash,pickup_latitude,pickup_longitude,dropoff_latitude,dropoff_longitude,verified_by,verified_at)"
            + " VALUES(?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE"
            + " address_hash=VALUES(address_hash),pickup_latitude=VALUES(pickup_latitude),pickup_longitude=VALUES(pickup_longitude),dropoff_latitude=VALUES(dropoff_latitude),dropoff_longitude=VALUES(dropoff_longitude),verified_by=VALUES(verified_by),verified_at=VALUES(verified_at)",
        id,
        r.getTenantId(),
        hash(r),
        privacy.encrypt(request.pickupLatitude().toString(),"coordinate"),
        privacy.encrypt(request.pickupLongitude().toString(),"coordinate"),
        privacy.encrypt(request.dropoffLatitude().toString(),"coordinate"),
        privacy.encrypt(request.dropoffLongitude().toString(),"coordinate"),
        users.requireCurrentUser().id(),
        now());
    record(r, "STOPS_VERIFIED", old, request);
    return summary(r, false);
  }

  public void requireDepartureReady(Ride r) {
    stops(r);
  }

  public static double distance(double lat1, double lon1, double lat2, double lon2) {
    double a =
        Math.pow(Math.sin(Math.toRadians(lat2 - lat1) / 2), 2)
            + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.pow(Math.sin(Math.toRadians(lon2 - lon1) / 2), 2);
    return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
  }

  @Transactional
  public Summary capture(long id, Capture request) {
    Ride r = driver.requireAssignedRide(id);
    lock(r);
    Map<String, Object> stop = stops(r);
    String expected =
        switch (request.milestone()) {
          case "ARRIVED" -> "DRIVER_EN_ROUTE";
          case "PICKED_UP" -> "ARRIVED";
          case "DROPPED_OFF" -> "PICKED_UP";
          default -> throw invalid("Invalid milestone.");
        };
    if (!r.getStatus().name().equals(expected))
      throw invalid("Refresh the trip before capturing this milestone.");
    if (!Boolean.FALSE.equals(request.mockedLocation()))
      throw invalid("Mocked or unverifiable location cannot establish milestone evidence.");
    var rows =
        db.queryForList(
            "SELECT *,UNIX_TIMESTAMP(captured_at) AS captured_epoch,UNIX_TIMESTAMP(created_at) AS"
                + " received_epoch FROM driver_location_snapshots WHERE ride_id=? AND tenant_id=?"
                + " AND driver_id=? AND vehicle_id=? ORDER BY captured_at DESC,id DESC LIMIT 1",
            id,
            r.getTenantId(),
            r.getDriverId(),
            r.getVehicleId());
    if (rows.isEmpty())
      throw invalid("A fresh driver GPS fix is required. Enable location and retry.");
    var gps = rows.getFirst();
    Instant captured = epoch(gps.get("captured_epoch")),
        received = epoch(gps.get("received_epoch"));
    if (captured.isBefore(clock.instant().minusSeconds(90))
        || captured.isAfter(clock.instant().plusSeconds(10))
        || received.isBefore(clock.instant().minusSeconds(90))
        || received.isAfter(clock.instant().plusSeconds(10)))
      throw invalid(
          "The GPS fix is stale or future-dated. Capture your current location and retry.");
    if (!(gps.get("accuracy_meters") instanceof Number accuracy)
        || !Double.isFinite(accuracy.doubleValue())
        || accuracy.doubleValue() < 0
        || accuracy.doubleValue() > 50)
      throw invalid("GPS accuracy must be within 50 meters. Move to a clear area and retry.");
    double lat = coordinate(gps.get("latitude")),
        lon = coordinate(gps.get("longitude"));
    String prefix = request.milestone().equals("DROPPED_OFF") ? "dropoff" : "pickup";
    double meters =
        distance(
            lat,
            lon,
            coordinate(stop.get(prefix + "_latitude")),
            coordinate(stop.get(prefix + "_longitude")));
    if (!Double.isFinite(lat)
        || !Double.isFinite(lon)
        || lat < -90
        || lat > 90
        || lon < -180
        || lon > 180
        || !Double.isFinite(meters)
        || meters + accuracy.doubleValue() > 200)
      throw invalid(
          "You must be within 200 meters of the verified stop, including GPS uncertainty.");
    BigDecimal odo = request.odometerMiles();
    if (!request.milestone().equals("ARRIVED")
        && (odo == null || odo.signum() < 0 || odo.scale() > 1))
      throw invalid("Enter the current odometer reading in miles, to at most one decimal place.");
    if (request.milestone().equals("DROPPED_OFF")) {
      var picked = consumed(r, "PICKED_UP");
      if (odo.compareTo((BigDecimal) picked.get("odometer_miles")) < 0)
        throw invalid("Drop-off odometer cannot be less than pickup odometer.");
    }
    db.update(
        "INSERT INTO"
            + " trip_milestone_evidence(ride_id,tenant_id,driver_id,vehicle_id,address_hash,milestone,snapshot_id,distance_meters,accuracy_meters,odometer_miles,recorded_by,recorded_at)"
            + " VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        id,
        r.getTenantId(),
        r.getDriverId(),
        r.getVehicleId(),
        hash(r),
        request.milestone(),
        gps.get("id"),
        meters,
        accuracy.doubleValue(),
        odo,
        users.requireCurrentUser().id(),
        now());
    record(
        r,
        "MILESTONE_CAPTURED",
        null,
        Map.of(
            "milestone",
            request.milestone(),
            "distanceMeters",
            meters,
            "snapshotId",
            gps.get("id")));
    return summary(r, false);
  }

  private Map<String, Object> consumed(Ride r, String milestone) {
    var rows =
        db.queryForList(
            "SELECT * FROM trip_milestone_evidence WHERE ride_id=? AND tenant_id=? AND driver_id=?"
                + " AND vehicle_id=? AND address_hash=? AND milestone=? AND consumed_at IS NOT NULL"
                + " ORDER BY id DESC LIMIT 1",
            r.getId(),
            r.getTenantId(),
            r.getDriverId(),
            r.getVehicleId(),
            hash(r),
            milestone);
    if (rows.isEmpty())
      throw invalid(
          "Verified " + milestone.toLowerCase().replace('_', ' ') + " evidence is required.");
    return rows.getFirst();
  }

  @Transactional
  public void requireMilestone(Ride r, String milestone) {
    stops(r);
    var rows =
        db.queryForList(
            "SELECT * FROM trip_milestone_evidence WHERE ride_id=? AND tenant_id=? AND driver_id=?"
                + " AND vehicle_id=? AND address_hash=? AND milestone=? AND consumed_at IS NULL AND"
                + " recorded_at>=? ORDER BY id DESC LIMIT 1 FOR UPDATE",
            r.getId(),
            r.getTenantId(),
            r.getDriverId(),
            r.getVehicleId(),
            hash(r),
            milestone,
            LocalDateTime.ofInstant(clock.instant().minusSeconds(90), ZoneOffset.UTC));
    if (rows.isEmpty())
      throw invalid("Capture fresh location evidence in the driver app before this milestone.");
    var e = rows.getFirst();
    var captureTime =
        db.queryForObject(
            "SELECT UNIX_TIMESTAMP(captured_at) FROM driver_location_snapshots WHERE id=?",
            BigDecimal.class,
            e.get("snapshot_id"));
    if (captureTime == null || epoch(captureTime).isBefore(clock.instant().minusSeconds(90)))
      throw invalid("The milestone GPS fix expired. Capture current location again.");
    if (!milestone.equals("ARRIVED"))
      consumed(r, milestone.equals("PICKED_UP") ? "ARRIVED" : "PICKED_UP");
    db.update("UPDATE trip_milestone_evidence SET consumed_at=? WHERE id=?", now(), e.get("id"));
  }

  public void requireComplete(Ride r) {
    stops(r);
    consumed(r, "ARRIVED");
    consumed(r, "PICKED_UP");
    var drop = consumed(r, "DROPPED_OFF");
    if (db.queryForList(
            "SELECT ride_id FROM trip_delivery_confirmations WHERE ride_id=? AND tenant_id=? AND"
                + " dropoff_evidence_id=?",
            r.getId(),
            r.getTenantId(),
            drop.get("id"))
        .isEmpty())
      throw invalid(
          "The rider or an authorized guardian must confirm delivery in their own app before"
              + " completion and billing.");
  }

  public void requireBillable(Ride r) {
    if (r.getStatus() != RideStatus.COMPLETED)
      throw invalid("Only completed rides with verified delivery may be billed or paid.");
    requireComplete(r);
  }

  private Ride passengerRide(long id) {
    var scope = passenger.resolveCurrentScope();
    if (scope.user().getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"))) throw forbidden();
    Ride r = rides.findByIdAndTenantId(id, scope.user().tenantId()).orElseThrow(this::forbidden);
    boolean allowed =
        scope.scopeType() == PortalSubjectType.RIDER
            ? scope.rider() != null && scope.rider().getId().equals(r.getRider().getId())
            : scope.links().stream()
                .anyMatch(
                    l ->
                        l.isAuthorizedForPickup()
                            && l.getRider().getId().equals(r.getRider().getId()));
    if (!allowed) throw forbidden();
    return r;
  }

  @Transactional
  public Summary confirm(long id, Confirmation request) {
    Ride r = passengerRide(id);
    lock(r);
    if (!request.delivered()) throw invalid("Explicit delivery confirmation is required.");
    if (!Set.of(RideStatus.DROPPED_OFF, RideStatus.COMPLETED).contains(r.getStatus()))
      throw invalid("Delivery can be confirmed only after verified drop-off.");
    var drop = consumed(r, "DROPPED_OFF");
    if (((Number) drop.get("id")).longValue() != request.dropoffEvidenceId())
      throw invalid("The drop-off record changed. Refresh and review it before confirming.");
    var existing =
        db.queryForList("SELECT ride_id FROM trip_delivery_confirmations WHERE ride_id=?", id);
    if (!existing.isEmpty()) return summary(r, true);
    var scope = passenger.resolveCurrentScope();
    long subject =
        scope.scopeType() == PortalSubjectType.RIDER
            ? scope.rider().getId()
            : scope.guardian().getId();
    db.update(
        "INSERT INTO"
            + " trip_delivery_confirmations(ride_id,tenant_id,dropoff_evidence_id,confirmed_by,confirmer_name,subject_type,subject_id,confirmed_at)"
            + " VALUES(?,?,?,?,?,?,?,?)",
        id,
        r.getTenantId(),
        drop.get("id"),
        scope.user().id(),
        scope.user().displayName(),
        scope.scopeType().name(),
        subject,
        now());
    record(
        r,
        "DELIVERY_CONFIRMED",
        null,
        Map.of(
            "dropoffEvidenceId",
            drop.get("id"),
            "subjectType",
            scope.scopeType().name(),
            "subjectId",
            subject));
    return summary(r, true);
  }

  @Transactional(readOnly = true)
  public Summary companySummary(long id) {
    return summary(company.findRideForCompanyScope(id), false);
  }

  @Transactional(readOnly = true)
  public Summary driverSummary(long id) {
    return summary(driver.requireAssignedRide(id), false);
  }

  @Transactional(readOnly = true)
  public Summary passengerSummary(long id) {
    return summary(passengerRide(id), true);
  }

  private Summary summary(Ride r, boolean canConfirm) {
    Stops stop = null;
    try {
      var s = stops(r);
      stop =
          new Stops(
              coordinate(s.get("pickup_latitude")),
              coordinate(s.get("pickup_longitude")),
              coordinate(s.get("dropoff_latitude")),
              coordinate(s.get("dropoff_longitude")));
    } catch (ApiException ignored) {
    }
    var milestones =
        db.query(
            "SELECT * FROM trip_milestone_evidence WHERE ride_id=? AND tenant_id=? ORDER BY id",
            (rs, n) ->
                new Milestone(
                    rs.getLong("id"),
                    rs.getString("milestone"),
                    rs.getDouble("distance_meters"),
                    rs.getDouble("accuracy_meters"),
                    rs.getBigDecimal("odometer_miles"),
                    rs.getObject("recorded_at", LocalDateTime.class).toInstant(ZoneOffset.UTC),
                    rs.getTimestamp("consumed_at") == null
                        ? null
                        : rs.getObject("consumed_at", LocalDateTime.class)
                            .toInstant(ZoneOffset.UTC)),
            r.getId(),
            r.getTenantId());
    var confirmations =
        db.query(
            "SELECT * FROM trip_delivery_confirmations WHERE ride_id=? AND tenant_id=?",
            (rs, n) ->
                new Confirmed(
                    rs.getString("confirmer_name"),
                    rs.getString("subject_type"),
                    rs.getObject("confirmed_at", LocalDateTime.class).toInstant(ZoneOffset.UTC)),
            r.getId(),
            r.getTenantId());
    boolean ready = false;
    try {
      requireComplete(r);
      ready = true;
    } catch (ApiException ignored) {
    }
    return new Summary(
        stop,
        milestones,
        confirmations.isEmpty() ? null : confirmations.getFirst(),
        canConfirm
            && r.getStatus() == RideStatus.DROPPED_OFF
            && confirmations.isEmpty()
            && milestones.stream()
                .anyMatch(m -> m.milestone().equals("DROPPED_OFF") && m.consumedAt() != null),
        ready);
  }

  private void record(Ride r, String action, Object old, Object saved) {
    audit.record(
        new AuditLogCommand(
            null,
            r.getTenantId(),
            "TRIP_EVIDENCE",
            action,
            "RIDE",
            r.getId().toString(),
            "Trip delivery evidence updated.",
            old,
            saved));
  }
}
