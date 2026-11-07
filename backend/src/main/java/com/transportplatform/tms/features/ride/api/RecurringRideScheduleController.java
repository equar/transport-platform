package com.transportplatform.tms.features.ride.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.ride.api.request.GenerateRecurringRideInstancesRequest;
import com.transportplatform.tms.features.ride.api.request.RecurringRideScheduleUpsertRequest;
import com.transportplatform.tms.features.ride.api.response.RecurringRideScheduleResponse;
import com.transportplatform.tms.features.ride.api.response.RideGenerationResultResponse;
import com.transportplatform.tms.features.ride.application.RecurringRideScheduleService;
import com.transportplatform.tms.features.ride.domain.RideRecurrencePatternType;
import com.transportplatform.tms.features.ride.domain.RideRecurrenceStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RecurringRideScheduleController {

    private final RecurringRideScheduleService recurringRideScheduleService;

    public RecurringRideScheduleController(RecurringRideScheduleService recurringRideScheduleService) {
        this.recurringRideScheduleService = recurringRideScheduleService;
    }

    @GetMapping("/company/recurring-rides")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<PageResponse<RecurringRideScheduleResponse>> searchCompanyRecurringRideSchedules(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RideRecurrenceStatus status,
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) RideTripType tripType,
            @RequestParam(required = false) RideRecurrencePatternType recurrencePatternType,
            @RequestParam(required = false) Long riderId,
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) Long contractId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(recurringRideScheduleService.searchCompanyRecurringRideSchedules(
                keyword,
                status,
                serviceType,
                tripType,
                recurrencePatternType,
                riderId,
                organizationId,
                contractId,
                fromDate,
                toDate,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/recurring-rides/{recurrenceId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RecurringRideScheduleResponse> getCompanyRecurringRideSchedule(@PathVariable Long recurrenceId) {
        return ApiResponse.success(recurringRideScheduleService.getCompanyRecurringRideSchedule(recurrenceId));
    }

    @PostMapping("/company/recurring-rides")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RecurringRideScheduleResponse> createCompanyRecurringRideSchedule(
            @Valid @RequestBody RecurringRideScheduleUpsertRequest request) {
        return ApiResponse.success(recurringRideScheduleService.createCompanyRecurringRideSchedule(request));
    }

    @PutMapping("/company/recurring-rides/{recurrenceId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RecurringRideScheduleResponse> updateCompanyRecurringRideSchedule(
            @PathVariable Long recurrenceId,
            @Valid @RequestBody RecurringRideScheduleUpsertRequest request) {
        return ApiResponse
                .success(recurringRideScheduleService.updateCompanyRecurringRideSchedule(recurrenceId, request));
    }

    @PostMapping("/company/recurring-rides/{recurrenceId}/activate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RecurringRideScheduleResponse> activateCompanyRecurringRideSchedule(
            @PathVariable Long recurrenceId) {
        return ApiResponse.success(recurringRideScheduleService.activateCompanyRecurringRideSchedule(recurrenceId));
    }

    @PostMapping("/company/recurring-rides/{recurrenceId}/pause")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RecurringRideScheduleResponse> pauseCompanyRecurringRideSchedule(
            @PathVariable Long recurrenceId) {
        return ApiResponse.success(recurringRideScheduleService.pauseCompanyRecurringRideSchedule(recurrenceId));
    }

    @PostMapping("/company/recurring-rides/{recurrenceId}/deactivate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RecurringRideScheduleResponse> deactivateCompanyRecurringRideSchedule(
            @PathVariable Long recurrenceId) {
        return ApiResponse.success(recurringRideScheduleService.deactivateCompanyRecurringRideSchedule(recurrenceId));
    }

    @PostMapping("/company/recurring-rides/{recurrenceId}/generate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideGenerationResultResponse> generateCompanyRecurringRideInstances(
            @PathVariable Long recurrenceId,
            @Valid @RequestBody GenerateRecurringRideInstancesRequest request) {
        return ApiResponse
                .success(recurringRideScheduleService.generateCompanyRecurringRideInstances(recurrenceId, request));
    }
}
