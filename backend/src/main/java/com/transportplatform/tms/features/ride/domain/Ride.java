package com.transportplatform.tms.features.ride.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import com.transportplatform.tms.features.organization.domain.Contract;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.ServiceArea;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.Rider;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "rides")
public class Ride extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(name = "entity_version", nullable = false)
    private long version;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "ride_number", nullable = false, length = 50)
    private String rideNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rider_id", nullable = false)
    private Rider rider;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guardian_id")
    private Guardian guardian;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_area_id")
    private ServiceArea serviceArea;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 40)
    private ServiceType serviceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "trip_type", nullable = false, length = 30)
    private RideTripType tripType;

    @Column(name = "pickup_address_line1", nullable = false, length = 200)
    private String pickupAddressLine1;

    @Column(name = "pickup_address_line2", length = 200)
    private String pickupAddressLine2;

    @Column(name = "pickup_city", nullable = false, length = 100)
    private String pickupCity;

    @Column(name = "pickup_state", nullable = false, length = 100)
    private String pickupState;

    @Column(name = "pickup_zip_code", nullable = false, length = 30)
    private String pickupZipCode;

    @Column(name = "pickup_country", nullable = false, length = 100)
    private String pickupCountry;

    @Column(name = "dropoff_address_line1", nullable = false, length = 200)
    private String dropoffAddressLine1;

    @Column(name = "dropoff_address_line2", length = 200)
    private String dropoffAddressLine2;

    @Column(name = "dropoff_city", nullable = false, length = 100)
    private String dropoffCity;

    @Column(name = "dropoff_state", nullable = false, length = 100)
    private String dropoffState;

    @Column(name = "dropoff_zip_code", nullable = false, length = 30)
    private String dropoffZipCode;

    @Column(name = "dropoff_country", nullable = false, length = 100)
    private String dropoffCountry;

    @Column(name = "scheduled_pickup_at", nullable = false)
    private LocalDateTime scheduledPickupAt;

    @Column(name = "scheduled_dropoff_at")
    private LocalDateTime scheduledDropoffAt;

    @Column(name = "return_pickup_at")
    private LocalDateTime returnPickupAt;

    @Column(name = "return_dropoff_at")
    private LocalDateTime returnDropoffAt;

    @Column(name = "wheelchair_required", nullable = false)
    private boolean wheelchairRequired;

    @Column(name = "escort_required", nullable = false)
    private boolean escortRequired;

    @Column(name = "companion_count", nullable = false)
    private int companionCount;

    @Column(name = "special_instructions", length = 2000)
    private String specialInstructions;

    @Column(name = "internal_notes", length = 2000)
    private String internalNotes;

    @Column(name = "operational_notes", length = 2000)
    private String operationalNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level", length = 30)
    private RidePriorityLevel priorityLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_type", length = 40)
    private RideBillingType billingType;

    @Column(name = "driver_id")
    private Long driverId;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    @Column(name = "route_id")
    private Long routeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recurrence_schedule_id")
    private RecurringRideSchedule recurrenceSchedule;

    @Column(name = "cancellation_reason", length = 1000)
    private String cancellationReason;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancelled_by", length = 100)
    private String cancelledBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RideStatus status;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getRideNumber() {
        return rideNumber;
    }

    public void setRideNumber(String rideNumber) {
        this.rideNumber = rideNumber;
    }

    public Rider getRider() {
        return rider;
    }

    public void setRider(Rider rider) {
        this.rider = rider;
    }

    public Guardian getGuardian() {
        return guardian;
    }

    public void setGuardian(Guardian guardian) {
        this.guardian = guardian;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public Contract getContract() {
        return contract;
    }

    public void setContract(Contract contract) {
        this.contract = contract;
    }

    public ServiceArea getServiceArea() {
        return serviceArea;
    }

    public void setServiceArea(ServiceArea serviceArea) {
        this.serviceArea = serviceArea;
    }

    public ServiceType getServiceType() {
        return serviceType;
    }

    public void setServiceType(ServiceType serviceType) {
        this.serviceType = serviceType;
    }

    public RideTripType getTripType() {
        return tripType;
    }

    public void setTripType(RideTripType tripType) {
        this.tripType = tripType;
    }

    public String getPickupAddressLine1() {
        return pickupAddressLine1;
    }

    public void setPickupAddressLine1(String pickupAddressLine1) {
        this.pickupAddressLine1 = pickupAddressLine1;
    }

    public String getPickupAddressLine2() {
        return pickupAddressLine2;
    }

    public void setPickupAddressLine2(String pickupAddressLine2) {
        this.pickupAddressLine2 = pickupAddressLine2;
    }

    public String getPickupCity() {
        return pickupCity;
    }

    public void setPickupCity(String pickupCity) {
        this.pickupCity = pickupCity;
    }

    public String getPickupState() {
        return pickupState;
    }

    public void setPickupState(String pickupState) {
        this.pickupState = pickupState;
    }

    public String getPickupZipCode() {
        return pickupZipCode;
    }

    public void setPickupZipCode(String pickupZipCode) {
        this.pickupZipCode = pickupZipCode;
    }

    public String getPickupCountry() {
        return pickupCountry;
    }

    public void setPickupCountry(String pickupCountry) {
        this.pickupCountry = pickupCountry;
    }

    public String getDropoffAddressLine1() {
        return dropoffAddressLine1;
    }

    public void setDropoffAddressLine1(String dropoffAddressLine1) {
        this.dropoffAddressLine1 = dropoffAddressLine1;
    }

    public String getDropoffAddressLine2() {
        return dropoffAddressLine2;
    }

    public void setDropoffAddressLine2(String dropoffAddressLine2) {
        this.dropoffAddressLine2 = dropoffAddressLine2;
    }

    public String getDropoffCity() {
        return dropoffCity;
    }

    public void setDropoffCity(String dropoffCity) {
        this.dropoffCity = dropoffCity;
    }

    public String getDropoffState() {
        return dropoffState;
    }

    public void setDropoffState(String dropoffState) {
        this.dropoffState = dropoffState;
    }

    public String getDropoffZipCode() {
        return dropoffZipCode;
    }

    public void setDropoffZipCode(String dropoffZipCode) {
        this.dropoffZipCode = dropoffZipCode;
    }

    public String getDropoffCountry() {
        return dropoffCountry;
    }

    public void setDropoffCountry(String dropoffCountry) {
        this.dropoffCountry = dropoffCountry;
    }

    public LocalDateTime getScheduledPickupAt() {
        return scheduledPickupAt;
    }

    public void setScheduledPickupAt(LocalDateTime scheduledPickupAt) {
        this.scheduledPickupAt = scheduledPickupAt;
    }

    public LocalDateTime getScheduledDropoffAt() {
        return scheduledDropoffAt;
    }

    public void setScheduledDropoffAt(LocalDateTime scheduledDropoffAt) {
        this.scheduledDropoffAt = scheduledDropoffAt;
    }

    public LocalDateTime getReturnPickupAt() {
        return returnPickupAt;
    }

    public void setReturnPickupAt(LocalDateTime returnPickupAt) {
        this.returnPickupAt = returnPickupAt;
    }

    public LocalDateTime getReturnDropoffAt() {
        return returnDropoffAt;
    }

    public void setReturnDropoffAt(LocalDateTime returnDropoffAt) {
        this.returnDropoffAt = returnDropoffAt;
    }

    public boolean isWheelchairRequired() {
        return wheelchairRequired;
    }

    public void setWheelchairRequired(boolean wheelchairRequired) {
        this.wheelchairRequired = wheelchairRequired;
    }

    public boolean isEscortRequired() {
        return escortRequired;
    }

    public void setEscortRequired(boolean escortRequired) {
        this.escortRequired = escortRequired;
    }

    public int getCompanionCount() {
        return companionCount;
    }

    public void setCompanionCount(int companionCount) {
        this.companionCount = companionCount;
    }

    public String getSpecialInstructions() {
        return specialInstructions;
    }

    public void setSpecialInstructions(String specialInstructions) {
        this.specialInstructions = specialInstructions;
    }

    public String getInternalNotes() {
        return internalNotes;
    }

    public void setInternalNotes(String internalNotes) {
        this.internalNotes = internalNotes;
    }

    public String getOperationalNotes() {
        return operationalNotes;
    }

    public void setOperationalNotes(String operationalNotes) {
        this.operationalNotes = operationalNotes;
    }

    public RidePriorityLevel getPriorityLevel() {
        return priorityLevel;
    }

    public void setPriorityLevel(RidePriorityLevel priorityLevel) {
        this.priorityLevel = priorityLevel;
    }

    public RideBillingType getBillingType() {
        return billingType;
    }

    public void setBillingType(RideBillingType billingType) {
        this.billingType = billingType;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Long getRouteId() {
        return routeId;
    }

    public void setRouteId(Long routeId) {
        this.routeId = routeId;
    }

    public RecurringRideSchedule getRecurrenceSchedule() {
        return recurrenceSchedule;
    }

    public void setRecurrenceSchedule(RecurringRideSchedule recurrenceSchedule) {
        this.recurrenceSchedule = recurrenceSchedule;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public String getCancelledBy() {
        return cancelledBy;
    }

    public void setCancelledBy(String cancelledBy) {
        this.cancelledBy = cancelledBy;
    }

    public RideStatus getStatus() {
        return status;
    }

    public void setStatus(RideStatus status) {
        this.status = status;
    }

    public long getVersion() {
        return version;
    }
}
