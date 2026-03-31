package com.transportplatform.tms.features.ride.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.ride.domain.RecurringRideSchedule;
import com.transportplatform.tms.features.ride.domain.RecurringRideScheduleRepository;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class RideAccessService {

    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final RideRepository rideRepository;
    private final RecurringRideScheduleRepository recurringRideScheduleRepository;

    public RideAccessService(CurrentAuthenticatedUserService currentAuthenticatedUserService,
            RideRepository rideRepository,
            RecurringRideScheduleRepository recurringRideScheduleRepository) {
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.rideRepository = rideRepository;
        this.recurringRideScheduleRepository = recurringRideScheduleRepository;
    }

    public AuthenticatedUser requireCompanyUser() {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean companyAdmin = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()));
        if (!companyAdmin || user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "A company administrator account is required for this operation.");
        }
        return user;
    }

    public String requireCompanyTenantId() {
        return requireCompanyUser().tenantId();
    }

    public Ride findRideForCompanyScope(Long rideId) {
        String tenantId = requireCompanyTenantId();
        return rideRepository.findByIdAndTenantId(rideId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Ride was not found."));
    }

    public RecurringRideSchedule findRecurringRideScheduleForCompanyScope(Long recurrenceId) {
        String tenantId = requireCompanyTenantId();
        return recurringRideScheduleRepository.findByIdAndTenantId(recurrenceId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Recurring ride schedule was not found."));
    }
}