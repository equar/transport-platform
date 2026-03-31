package com.transportplatform.tms.features.rider.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
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
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "riders")
public class Rider extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "rider_code", nullable = false, length = 50)
    private String riderCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "rider_type", nullable = false, length = 30)
    private RiderType riderType;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "middle_name", length = 100)
    private String middleName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 30)
    private RiderGender gender;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "primary_phone", nullable = false, length = 50)
    private String primaryPhone;

    @Column(name = "alternate_phone", length = 50)
    private String alternatePhone;

    @Column(name = "home_address_line1", length = 200)
    private String homeAddressLine1;

    @Column(name = "home_address_line2", length = 200)
    private String homeAddressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "zip_code", length = 30)
    private String zipCode;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "default_pickup_address", length = 300)
    private String defaultPickupAddress;

    @Column(name = "default_dropoff_address", length = 300)
    private String defaultDropoffAddress;

    @Column(name = "pickup_notes", length = 1000)
    private String pickupNotes;

    @Column(name = "dropoff_notes", length = 1000)
    private String dropoffNotes;

    @Column(name = "preferred_pickup_window_start")
    private LocalTime preferredPickupWindowStart;

    @Column(name = "preferred_pickup_window_end")
    private LocalTime preferredPickupWindowEnd;

    @Column(name = "preferred_dropoff_window_start")
    private LocalTime preferredDropoffWindowStart;

    @Column(name = "preferred_dropoff_window_end")
    private LocalTime preferredDropoffWindowEnd;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "rider_mobility_needs", joinColumns = @JoinColumn(name = "rider_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "mobility_need", nullable = false, length = 40)
    private Set<RiderMobilityNeed> mobilityNeeds = new LinkedHashSet<>();

    @Column(name = "wheelchair_required", nullable = false)
    private boolean wheelchairRequired;

    @Column(name = "escort_required", nullable = false)
    private boolean escortRequired;

    @Column(name = "special_instructions", length = 2000)
    private String specialInstructions;

    @Column(name = "care_notes_summary", length = 2000)
    private String careNotesSummary;

    @Column(name = "emergency_contact_name", length = 150)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 50)
    private String emergencyContactPhone;

    @Column(name = "emergency_contact_relationship", length = 100)
    private String emergencyContactRelationship;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(name = "notes", length = 2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RiderStatus status;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getRiderCode() {
        return riderCode;
    }

    public void setRiderCode(String riderCode) {
        this.riderCode = riderCode;
    }

    public RiderType getRiderType() {
        return riderType;
    }

    public void setRiderType(RiderType riderType) {
        this.riderType = riderType;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getMiddleName() {
        return middleName;
    }

    public void setMiddleName(String middleName) {
        this.middleName = middleName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public RiderGender getGender() {
        return gender;
    }

    public void setGender(RiderGender gender) {
        this.gender = gender;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPrimaryPhone() {
        return primaryPhone;
    }

    public void setPrimaryPhone(String primaryPhone) {
        this.primaryPhone = primaryPhone;
    }

    public String getAlternatePhone() {
        return alternatePhone;
    }

    public void setAlternatePhone(String alternatePhone) {
        this.alternatePhone = alternatePhone;
    }

    public String getHomeAddressLine1() {
        return homeAddressLine1;
    }

    public void setHomeAddressLine1(String homeAddressLine1) {
        this.homeAddressLine1 = homeAddressLine1;
    }

    public String getHomeAddressLine2() {
        return homeAddressLine2;
    }

    public void setHomeAddressLine2(String homeAddressLine2) {
        this.homeAddressLine2 = homeAddressLine2;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getZipCode() {
        return zipCode;
    }

    public void setZipCode(String zipCode) {
        this.zipCode = zipCode;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getDefaultPickupAddress() {
        return defaultPickupAddress;
    }

    public void setDefaultPickupAddress(String defaultPickupAddress) {
        this.defaultPickupAddress = defaultPickupAddress;
    }

    public String getDefaultDropoffAddress() {
        return defaultDropoffAddress;
    }

    public void setDefaultDropoffAddress(String defaultDropoffAddress) {
        this.defaultDropoffAddress = defaultDropoffAddress;
    }

    public String getPickupNotes() {
        return pickupNotes;
    }

    public void setPickupNotes(String pickupNotes) {
        this.pickupNotes = pickupNotes;
    }

    public String getDropoffNotes() {
        return dropoffNotes;
    }

    public void setDropoffNotes(String dropoffNotes) {
        this.dropoffNotes = dropoffNotes;
    }

    public LocalTime getPreferredPickupWindowStart() {
        return preferredPickupWindowStart;
    }

    public void setPreferredPickupWindowStart(LocalTime preferredPickupWindowStart) {
        this.preferredPickupWindowStart = preferredPickupWindowStart;
    }

    public LocalTime getPreferredPickupWindowEnd() {
        return preferredPickupWindowEnd;
    }

    public void setPreferredPickupWindowEnd(LocalTime preferredPickupWindowEnd) {
        this.preferredPickupWindowEnd = preferredPickupWindowEnd;
    }

    public LocalTime getPreferredDropoffWindowStart() {
        return preferredDropoffWindowStart;
    }

    public void setPreferredDropoffWindowStart(LocalTime preferredDropoffWindowStart) {
        this.preferredDropoffWindowStart = preferredDropoffWindowStart;
    }

    public LocalTime getPreferredDropoffWindowEnd() {
        return preferredDropoffWindowEnd;
    }

    public void setPreferredDropoffWindowEnd(LocalTime preferredDropoffWindowEnd) {
        this.preferredDropoffWindowEnd = preferredDropoffWindowEnd;
    }

    public Set<RiderMobilityNeed> getMobilityNeeds() {
        return mobilityNeeds;
    }

    public void setMobilityNeeds(Set<RiderMobilityNeed> mobilityNeeds) {
        this.mobilityNeeds = mobilityNeeds;
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

    public String getSpecialInstructions() {
        return specialInstructions;
    }

    public void setSpecialInstructions(String specialInstructions) {
        this.specialInstructions = specialInstructions;
    }

    public String getCareNotesSummary() {
        return careNotesSummary;
    }

    public void setCareNotesSummary(String careNotesSummary) {
        this.careNotesSummary = careNotesSummary;
    }

    public String getEmergencyContactName() {
        return emergencyContactName;
    }

    public void setEmergencyContactName(String emergencyContactName) {
        this.emergencyContactName = emergencyContactName;
    }

    public String getEmergencyContactPhone() {
        return emergencyContactPhone;
    }

    public void setEmergencyContactPhone(String emergencyContactPhone) {
        this.emergencyContactPhone = emergencyContactPhone;
    }

    public String getEmergencyContactRelationship() {
        return emergencyContactRelationship;
    }

    public void setEmergencyContactRelationship(String emergencyContactRelationship) {
        this.emergencyContactRelationship = emergencyContactRelationship;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(Long organizationId) {
        this.organizationId = organizationId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public RiderStatus getStatus() {
        return status;
    }

    public void setStatus(RiderStatus status) {
        this.status = status;
    }
}