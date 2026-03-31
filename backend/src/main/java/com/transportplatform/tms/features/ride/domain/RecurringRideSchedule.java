package com.transportplatform.tms.features.ride.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import com.transportplatform.tms.features.organization.domain.Contract;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.ServiceArea;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.Rider;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "recurring_ride_schedules")
public class RecurringRideSchedule extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "recurrence_code", nullable = false, length = 50)
    private String recurrenceCode;

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

    @Column(name = "scheduled_pickup_time", nullable = false)
    private LocalTime scheduledPickupTime;

    @Column(name = "scheduled_dropoff_time")
    private LocalTime scheduledDropoffTime;

    @Column(name = "return_pickup_time")
    private LocalTime returnPickupTime;

    @Column(name = "return_dropoff_time")
    private LocalTime returnDropoffTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_pattern_type", nullable = false, length = 30)
    private RideRecurrencePatternType recurrencePatternType;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recurring_ride_schedule_days_of_week", joinColumns = @JoinColumn(name = "recurring_ride_schedule_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 20)
    private Set<DayOfWeek> daysOfWeek = new LinkedHashSet<>();

    @Column(name = "interval_days")
    private Integer intervalDays;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "occurrence_limit")
    private Integer occurrenceLimit;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recurring_ride_schedule_skip_dates", joinColumns = @JoinColumn(name = "recurring_ride_schedule_id"))
    @Column(name = "skip_date", nullable = false)
    private Set<LocalDate> skipDates = new LinkedHashSet<>();

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

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_type", length = 40)
    private RideBillingType billingType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RideRecurrenceStatus status;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getRecurrenceCode() {
        return recurrenceCode;
    }

    public void setRecurrenceCode(String recurrenceCode) {
        this.recurrenceCode = recurrenceCode;
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

    public LocalTime getScheduledPickupTime() {
        return scheduledPickupTime;
    }

    public void setScheduledPickupTime(LocalTime scheduledPickupTime) {
        this.scheduledPickupTime = scheduledPickupTime;
    }

    public LocalTime getScheduledDropoffTime() {
        return scheduledDropoffTime;
    }

    public void setScheduledDropoffTime(LocalTime scheduledDropoffTime) {
        this.scheduledDropoffTime = scheduledDropoffTime;
    }

    public LocalTime getReturnPickupTime() {
        return returnPickupTime;
    }

    public void setReturnPickupTime(LocalTime returnPickupTime) {
        this.returnPickupTime = returnPickupTime;
    }

    public LocalTime getReturnDropoffTime() {
        return returnDropoffTime;
    }

    public void setReturnDropoffTime(LocalTime returnDropoffTime) {
        this.returnDropoffTime = returnDropoffTime;
    }

    public RideRecurrencePatternType getRecurrencePatternType() {
        return recurrencePatternType;
    }

    public void setRecurrencePatternType(RideRecurrencePatternType recurrencePatternType) {
        this.recurrencePatternType = recurrencePatternType;
    }

    public Set<DayOfWeek> getDaysOfWeek() {
        return daysOfWeek;
    }

    public void setDaysOfWeek(Set<DayOfWeek> daysOfWeek) {
        this.daysOfWeek = daysOfWeek;
    }

    public Integer getIntervalDays() {
        return intervalDays;
    }

    public void setIntervalDays(Integer intervalDays) {
        this.intervalDays = intervalDays;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Integer getOccurrenceLimit() {
        return occurrenceLimit;
    }

    public void setOccurrenceLimit(Integer occurrenceLimit) {
        this.occurrenceLimit = occurrenceLimit;
    }

    public Set<LocalDate> getSkipDates() {
        return skipDates;
    }

    public void setSkipDates(Set<LocalDate> skipDates) {
        this.skipDates = skipDates;
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

    public RideBillingType getBillingType() {
        return billingType;
    }

    public void setBillingType(RideBillingType billingType) {
        this.billingType = billingType;
    }

    public RideRecurrenceStatus getStatus() {
        return status;
    }

    public void setStatus(RideRecurrenceStatus status) {
        this.status = status;
    }
}