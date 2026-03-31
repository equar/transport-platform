package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.features.driver.api.request.DriverUpsertRequest;
import com.transportplatform.tms.features.driver.api.response.DriverComplianceSummaryResponse;
import com.transportplatform.tms.features.driver.api.response.DriverResponse;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverQualificationStatus;
import com.transportplatform.tms.features.driver.domain.DriverTrainingStatus;
import org.springframework.stereotype.Component;

@Component
public class DriverMapper {

    public void apply(Driver driver, DriverUpsertRequest request) {
        driver.setFirstName(request.firstName().trim());
        driver.setMiddleName(trimToNull(request.middleName()));
        driver.setLastName(request.lastName().trim());
        driver.setDateOfBirth(request.dateOfBirth());
        driver.setEmail(request.email() == null ? null : request.email().trim().toLowerCase());
        driver.setPhone(request.phone().trim());
        driver.setAlternatePhone(trimToNull(request.alternatePhone()));
        driver.setAddressLine1(trimToNull(request.addressLine1()));
        driver.setAddressLine2(trimToNull(request.addressLine2()));
        driver.setCity(trimToNull(request.city()));
        driver.setState(trimToNull(request.state()));
        driver.setZipCode(trimToNull(request.zipCode()));
        driver.setCountry(trimToNull(request.country()));
        driver.setDriverType(request.driverType());
        driver.setHireDate(request.hireDate());
        driver.setStartDate(request.startDate());
        driver.setAvailabilitySummary(trimToNull(request.availabilitySummary()));
        driver.setLicenseNumber(trimToNull(request.licenseNumber()));
        driver.setLicenseState(trimToNull(request.licenseState()));
        driver.setLicenseExpiryDate(request.licenseExpiryDate());
        driver.setBackgroundCheckStatus(
                request.backgroundCheckStatus() == null ? DriverQualificationStatus.PENDING
                        : request.backgroundCheckStatus());
        driver.setBackgroundCheckExpiryDate(request.backgroundCheckExpiryDate());
        driver.setDrugTestStatus(
                request.drugTestStatus() == null ? DriverQualificationStatus.PENDING : request.drugTestStatus());
        driver.setDrugTestExpiryDate(request.drugTestExpiryDate());
        driver.setTrainingStatus(
                request.trainingStatus() == null ? DriverTrainingStatus.NOT_STARTED : request.trainingStatus());
        driver.setTrainingCompletionDate(request.trainingCompletionDate());
        driver.setEmergencyContactName(trimToNull(request.emergencyContactName()));
        driver.setEmergencyContactPhone(trimToNull(request.emergencyContactPhone()));
        driver.setEmergencyContactRelationship(trimToNull(request.emergencyContactRelationship()));
        driver.setNotes(trimToNull(request.notes()));
    }

    public DriverResponse toResponse(Driver driver, DriverComplianceSummaryResponse complianceSummary) {
        return new DriverResponse(
                driver.getId(),
                driver.getTenantId(),
                driver.getDriverCode(),
                driver.getFirstName(),
                driver.getMiddleName(),
                driver.getLastName(),
                driver.getDateOfBirth(),
                driver.getEmail(),
                driver.getPhone(),
                driver.getAlternatePhone(),
                driver.getAddressLine1(),
                driver.getAddressLine2(),
                driver.getCity(),
                driver.getState(),
                driver.getZipCode(),
                driver.getCountry(),
                driver.getDriverType(),
                driver.getStatus(),
                driver.getHireDate(),
                driver.getStartDate(),
                driver.getAvailabilitySummary(),
                driver.getLicenseNumber(),
                driver.getLicenseState(),
                driver.getLicenseExpiryDate(),
                driver.getBackgroundCheckStatus(),
                driver.getBackgroundCheckExpiryDate(),
                driver.getDrugTestStatus(),
                driver.getDrugTestExpiryDate(),
                driver.getTrainingStatus(),
                driver.getTrainingCompletionDate(),
                driver.getEmergencyContactName(),
                driver.getEmergencyContactPhone(),
                driver.getEmergencyContactRelationship(),
                driver.getNotes(),
                driver.getCreatedBy(),
                driver.getCreatedAt(),
                driver.getUpdatedBy(),
                driver.getUpdatedAt(),
                complianceSummary);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}