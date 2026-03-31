package com.transportplatform.tms.features.rider.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "guardians")
public class Guardian extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "middle_name", length = 100)
    private String middleName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "relation_to_rider_default", length = 100)
    private String relationToRiderDefault;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "phone", nullable = false, length = 50)
    private String phone;

    @Column(name = "alternate_phone", length = 50)
    private String alternatePhone;

    @Column(name = "address_line1", length = 200)
    private String addressLine1;

    @Column(name = "address_line2", length = 200)
    private String addressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "zip_code", length = 30)
    private String zipCode;

    @Column(name = "country", length = 100)
    private String country;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_communication_method", length = 30)
    private GuardianPreferredCommunicationMethod preferredCommunicationMethod;

    @Column(name = "billing_contact", nullable = false)
    private boolean billingContact;

    @Column(name = "authorized_for_pickup", nullable = false)
    private boolean authorizedForPickup;

    @Column(name = "notes", length = 2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private GuardianStatus status;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
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

    public String getRelationToRiderDefault() {
        return relationToRiderDefault;
    }

    public void setRelationToRiderDefault(String relationToRiderDefault) {
        this.relationToRiderDefault = relationToRiderDefault;
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

    public String getAlternatePhone() {
        return alternatePhone;
    }

    public void setAlternatePhone(String alternatePhone) {
        this.alternatePhone = alternatePhone;
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

    public GuardianPreferredCommunicationMethod getPreferredCommunicationMethod() {
        return preferredCommunicationMethod;
    }

    public void setPreferredCommunicationMethod(GuardianPreferredCommunicationMethod preferredCommunicationMethod) {
        this.preferredCommunicationMethod = preferredCommunicationMethod;
    }

    public boolean isBillingContact() {
        return billingContact;
    }

    public void setBillingContact(boolean billingContact) {
        this.billingContact = billingContact;
    }

    public boolean isAuthorizedForPickup() {
        return authorizedForPickup;
    }

    public void setAuthorizedForPickup(boolean authorizedForPickup) {
        this.authorizedForPickup = authorizedForPickup;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public GuardianStatus getStatus() {
        return status;
    }

    public void setStatus(GuardianStatus status) {
        this.status = status;
    }
}