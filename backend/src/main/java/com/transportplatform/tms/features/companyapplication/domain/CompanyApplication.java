package com.transportplatform.tms.features.companyapplication.domain;

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
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "company_applications")
public class CompanyApplication extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_number", nullable = false, length = 50)
    private String applicationNumber;

    @Column(name = "legal_company_name", nullable = false, length = 150)
    private String legalCompanyName;

    @Column(name = "dba_name", length = 150)
    private String dbaName;

    @Column(name = "contact_first_name", nullable = false, length = 100)
    private String contactFirstName;

    @Column(name = "contact_last_name", nullable = false, length = 100)
    private String contactLastName;

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Column(name = "phone", nullable = false, length = 50)
    private String phone;

    @Column(name = "business_type", nullable = false, length = 100)
    private String businessType;

    @Column(name = "address_line1", nullable = false, length = 200)
    private String addressLine1;

    @Column(name = "address_line2", length = 200)
    private String addressLine2;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "state", nullable = false, length = 100)
    private String state;

    @Column(name = "zip_code", nullable = false, length = 30)
    private String zipCode;

    @Column(name = "country", nullable = false, length = 100)
    private String country;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "company_application_service_types", joinColumns = @JoinColumn(name = "company_application_id"))
    @Column(name = "service_type", nullable = false, length = 80)
    private Set<String> requestedServiceTypes = new LinkedHashSet<>();

    @Column(name = "fleet_size")
    private Integer fleetSize;

    @Column(name = "number_of_drivers")
    private Integer numberOfDrivers;

    @Column(name = "notes", length = 2000)
    private String notes;

    @Column(name = "review_notes", length = 2000)
    private String reviewNotes;

    @Column(name = "rejection_reason", length = 2000)
    private String rejectionReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private CompanyApplicationStatus status;

    @Column(name = "approved_tenant_id", length = 36)
    private String approvedTenantId;

    @Column(name = "owner_user_id")
    private Long ownerUserId;

    public Long getId() {
        return id;
    }

    public String getApplicationNumber() {
        return applicationNumber;
    }

    public void setApplicationNumber(String applicationNumber) {
        this.applicationNumber = applicationNumber;
    }

    public String getLegalCompanyName() {
        return legalCompanyName;
    }

    public void setLegalCompanyName(String legalCompanyName) {
        this.legalCompanyName = legalCompanyName;
    }

    public String getDbaName() {
        return dbaName;
    }

    public void setDbaName(String dbaName) {
        this.dbaName = dbaName;
    }

    public String getContactFirstName() {
        return contactFirstName;
    }

    public void setContactFirstName(String contactFirstName) {
        this.contactFirstName = contactFirstName;
    }

    public String getContactLastName() {
        return contactLastName;
    }

    public void setContactLastName(String contactLastName) {
        this.contactLastName = contactLastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getBusinessType() {
        return businessType;
    }

    public void setBusinessType(String businessType) {
        this.businessType = businessType;
    }

    public String getAddressLine1() {
        return addressLine1;
    }

    public void setAddressLine1(String addressLine1) {
        this.addressLine1 = addressLine1;
    }

    public String getAddressLine2() {
        return addressLine2;
    }

    public void setAddressLine2(String addressLine2) {
        this.addressLine2 = addressLine2;
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

    public Set<String> getRequestedServiceTypes() {
        return requestedServiceTypes;
    }

    public void setRequestedServiceTypes(Set<String> requestedServiceTypes) {
        this.requestedServiceTypes = requestedServiceTypes;
    }

    public Integer getFleetSize() {
        return fleetSize;
    }

    public void setFleetSize(Integer fleetSize) {
        this.fleetSize = fleetSize;
    }

    public Integer getNumberOfDrivers() {
        return numberOfDrivers;
    }

    public void setNumberOfDrivers(Integer numberOfDrivers) {
        this.numberOfDrivers = numberOfDrivers;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getReviewNotes() {
        return reviewNotes;
    }

    public void setReviewNotes(String reviewNotes) {
        this.reviewNotes = reviewNotes;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public CompanyApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(CompanyApplicationStatus status) {
        this.status = status;
    }

    public String getApprovedTenantId() {
        return approvedTenantId;
    }

    public void setApprovedTenantId(String approvedTenantId) {
        this.approvedTenantId = approvedTenantId;
    }

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(Long ownerUserId) {
        this.ownerUserId = ownerUserId;
    }
}
