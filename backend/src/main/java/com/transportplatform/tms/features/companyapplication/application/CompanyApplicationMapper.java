package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.features.companyapplication.api.request.CompanyApplicationSubmissionRequest;
import com.transportplatform.tms.features.companyapplication.api.response.CompanyApplicationResponse;
import com.transportplatform.tms.features.companyapplication.api.response.CompanyApplicationReviewEventResponse;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplication;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationReviewEvent;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class CompanyApplicationMapper {

    public void apply(CompanyApplication application, CompanyApplicationSubmissionRequest request) {
        application.setLegalCompanyName(request.legalCompanyName().trim());
        application.setDbaName(request.dbaName() == null ? null : request.dbaName().trim());
        application.setContactFirstName(request.contactFirstName().trim());
        application.setContactLastName(request.contactLastName().trim());
        application.setEmail(request.email().trim().toLowerCase());
        application.setPhone(request.phone().trim());
        application.setBusinessType(request.businessType().trim());
        application.setAddressLine1(request.addressLine1().trim());
        application.setAddressLine2(request.addressLine2() == null ? null : request.addressLine2().trim());
        application.setCity(request.city().trim());
        application.setState(request.state().trim());
        application.setZipCode(request.zipCode().trim());
        application.setCountry(request.country().trim());
        application.setRequestedServiceTypes(
                new LinkedHashSet<>(request.requestedServiceTypes().stream().map(String::trim).toList()));
        application.setFleetSize(request.fleetSize());
        application.setNumberOfDrivers(request.numberOfDrivers());
        application.setNotes(request.notes() == null ? null : request.notes().trim());
    }

    public CompanyApplicationResponse toResponse(CompanyApplication application,
            List<CompanyApplicationReviewEvent> reviewEvents) {
        return new CompanyApplicationResponse(
                application.getId(),
                application.getApplicationNumber(),
                application.getLegalCompanyName(),
                application.getDbaName(),
                application.getContactFirstName(),
                application.getContactLastName(),
                application.getEmail(),
                application.getPhone(),
                application.getBusinessType(),
                application.getAddressLine1(),
                application.getAddressLine2(),
                application.getCity(),
                application.getState(),
                application.getZipCode(),
                application.getCountry(),
                application.getRequestedServiceTypes(),
                application.getFleetSize(),
                application.getNumberOfDrivers(),
                application.getNotes(),
                application.getReviewNotes(),
                application.getRejectionReason(),
                application.getStatus(),
                application.getApprovedTenantId(),
                application.getOwnerUserId(),
                application.getCreatedBy(),
                application.getCreatedAt(),
                application.getUpdatedBy(),
                application.getUpdatedAt(),
                reviewEvents.stream().map(this::toEventResponse).toList());
    }

    private CompanyApplicationReviewEventResponse toEventResponse(CompanyApplicationReviewEvent event) {
        return new CompanyApplicationReviewEventResponse(
                event.getId(),
                event.getAction(),
                event.getFromStatus(),
                event.getToStatus(),
                event.getNotes(),
                event.getCreatedBy(),
                event.getCreatedAt());
    }
}
