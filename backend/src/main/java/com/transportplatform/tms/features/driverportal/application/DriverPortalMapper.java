package com.transportplatform.tms.features.driverportal.application;

import com.transportplatform.tms.features.compliance.domain.ComplianceIssue;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverDocument;
import com.transportplatform.tms.features.driverportal.api.request.DriverPortalProfileUpdateRequest;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalComplianceIssueResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalDocumentResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalProfileResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRideDetailResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRideSummaryResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRouteDetailResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRouteStopResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRouteSummaryResponse;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.route.domain.Route;
import com.transportplatform.tms.features.route.domain.RouteStop;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class DriverPortalMapper {

    public DriverPortalProfileResponse toProfileResponse(Driver driver) {
        return new DriverPortalProfileResponse(
                driver.getId(),
                driver.getDriverCode(),
                driver.getFirstName(),
                driver.getLastName(),
                driver.getEmail(),
                driver.getPhone(),
                driver.getAlternatePhone(),
                driver.getAddressLine1(),
                driver.getAddressLine2(),
                driver.getCity(),
                driver.getState(),
                driver.getZipCode(),
                driver.getCountry(),
                driver.getAvailabilitySummary(),
                driver.getEmergencyContactName(),
                driver.getEmergencyContactPhone(),
                driver.getEmergencyContactRelationship(),
                driver.getNotes(),
                driver.getStatus(),
                driver.getLicenseExpiryDate(),
                driver.getBackgroundCheckExpiryDate(),
                driver.getDrugTestExpiryDate(),
                driver.getTrainingCompletionDate(),
                driver.getUpdatedAt());
    }

    public void applyProfileUpdate(Driver driver, DriverPortalProfileUpdateRequest request) {
        driver.setPhone(trimToNull(request.phone()));
        driver.setAlternatePhone(trimToNull(request.alternatePhone()));
        driver.setAddressLine1(trimToNull(request.addressLine1()));
        driver.setAddressLine2(trimToNull(request.addressLine2()));
        driver.setCity(trimToNull(request.city()));
        driver.setState(trimToNull(request.state()));
        driver.setZipCode(trimToNull(request.zipCode()));
        driver.setCountry(trimToNull(request.country()));
        driver.setAvailabilitySummary(trimToNull(request.availabilitySummary()));
        driver.setEmergencyContactName(trimToNull(request.emergencyContactName()));
        driver.setEmergencyContactPhone(trimToNull(request.emergencyContactPhone()));
        driver.setEmergencyContactRelationship(trimToNull(request.emergencyContactRelationship()));
        driver.setNotes(trimToNull(request.notes()));
    }

    public DriverPortalDocumentResponse toDocumentResponse(DriverDocument document) {
        return new DriverPortalDocumentResponse(
                document.getId(),
                document.getDocumentType(),
                document.getOriginalFileName() == null ? document.getFileName() : document.getOriginalFileName(),
                document.getIssueDate(),
                document.getExpiryDate(),
                document.getVerificationStatus(),
                document.getStatus(),
                document.getNotes());
    }

    public DriverPortalComplianceIssueResponse toComplianceIssueResponse(ComplianceIssue issue) {
        return new DriverPortalComplianceIssueResponse(
                issue.getId(),
                issue.getIssueType(),
                issue.getSeverity(),
                issue.getIssueStatus(),
                issue.getSummary(),
                issue.getRecommendedAction(),
                issue.getRelatedDocumentType(),
                issue.getExpiryDate(),
                issue.getUpdatedAt());
    }

    public DriverPortalRideSummaryResponse toRideSummaryResponse(Ride ride) {
        return new DriverPortalRideSummaryResponse(
                ride.getId(),
                ride.getRideNumber(),
                ride.getStatus(),
                ride.getServiceType(),
                ride.getTripType(),
                ride.getScheduledPickupAt(),
                ride.getScheduledDropoffAt(),
                fullName(ride.getRider().getFirstName(), ride.getRider().getLastName()),
                ride.getGuardian() == null ? null
                        : fullName(ride.getGuardian().getFirstName(), ride.getGuardian().getLastName()),
                ride.getOrganization() == null ? null : ride.getOrganization().getName(),
                address(ride.getPickupAddressLine1(), ride.getPickupAddressLine2(), ride.getPickupCity(),
                        ride.getPickupState(), ride.getPickupZipCode()),
                address(ride.getDropoffAddressLine1(), ride.getDropoffAddressLine2(), ride.getDropoffCity(),
                        ride.getDropoffState(), ride.getDropoffZipCode()),
                ride.getRouteId());
    }

    public DriverPortalRideDetailResponse toRideDetailResponse(Ride ride) {
        return new DriverPortalRideDetailResponse(
                ride.getId(),
                ride.getRideNumber(),
                ride.getStatus(),
                ride.getServiceType(),
                ride.getTripType(),
                ride.getScheduledPickupAt(),
                ride.getScheduledDropoffAt(),
                ride.getReturnPickupAt(),
                ride.getReturnDropoffAt(),
                fullName(ride.getRider().getFirstName(), ride.getRider().getLastName()),
                ride.getGuardian() == null ? null
                        : fullName(ride.getGuardian().getFirstName(), ride.getGuardian().getLastName()),
                ride.getOrganization() == null ? null : ride.getOrganization().getName(),
                address(ride.getPickupAddressLine1(), ride.getPickupAddressLine2(), ride.getPickupCity(),
                        ride.getPickupState(), ride.getPickupZipCode()),
                address(ride.getDropoffAddressLine1(), ride.getDropoffAddressLine2(), ride.getDropoffCity(),
                        ride.getDropoffState(), ride.getDropoffZipCode()),
                ride.isWheelchairRequired(),
                ride.isEscortRequired(),
                ride.getCompanionCount(),
                ride.getSpecialInstructions(),
                ride.getOperationalNotes(),
                ride.getRouteId());
    }

    public DriverPortalRouteSummaryResponse toRouteSummaryResponse(Route route, long linkedRideCount) {
        return new DriverPortalRouteSummaryResponse(
                route.getId(),
                route.getRouteCode(),
                route.getRouteName(),
                route.getRouteDate(),
                route.getServiceType(),
                route.getStatus(),
                route.getStartTime(),
                route.getEndTime(),
                linkedRideCount);
    }

    public DriverPortalRouteDetailResponse toRouteDetailResponse(Route route,
            List<DriverPortalRouteStopResponse> stops) {
        return new DriverPortalRouteDetailResponse(
                route.getId(),
                route.getRouteCode(),
                route.getRouteName(),
                route.getRouteDate(),
                route.getServiceType(),
                route.getStatus(),
                route.getStartTime(),
                route.getEndTime(),
                route.getManifestNotes(),
                route.getNotes(),
                stops);
    }

    public DriverPortalRouteStopResponse toRouteStopResponse(RouteStop stop) {
        Ride ride = stop.getRide();
        return new DriverPortalRouteStopResponse(
                stop.getId(),
                stop.getStopSequence(),
                stop.getStatus(),
                ride.getId(),
                ride.getRideNumber(),
                fullName(ride.getRider().getFirstName(), ride.getRider().getLastName()),
                stop.getPlannedPickupAt(),
                stop.getPlannedDropoffAt(),
                address(ride.getPickupAddressLine1(), ride.getPickupAddressLine2(), ride.getPickupCity(),
                        ride.getPickupState(), ride.getPickupZipCode()),
                address(ride.getDropoffAddressLine1(), ride.getDropoffAddressLine2(), ride.getDropoffCity(),
                        ride.getDropoffState(), ride.getDropoffZipCode()));
    }

    private String fullName(String firstName, String lastName) {
        String fullName = ((firstName == null ? "" : firstName.trim()) + " "
                + (lastName == null ? "" : lastName.trim())).trim();
        return fullName.isBlank() ? null : fullName;
    }

    private String address(String line1, String line2, String city, String state, String zipCode) {
        return List.of(trimToNull(line1), trimToNull(line2), trimToNull(city), trimToNull(state), trimToNull(zipCode))
                .stream()
                .filter(value -> value != null && !value.isBlank())
                .reduce((left, right) -> left + ", " + right)
                .orElse(null);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}