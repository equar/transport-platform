package com.transportplatform.tms.features.tripevidence.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.billing.application.*;
import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driverearnings.application.*;
import com.transportplatform.tms.features.driverearnings.domain.*;
import com.transportplatform.tms.features.driverportal.application.*;
import com.transportplatform.tms.features.ride.application.*;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.settings.domain.TenantSettingsRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class TripFinancialGuardsTest {
  ApiException missing() {
    return new ApiException(
        ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, "Missing delivery evidence");
  }

  @Test
  void companyCompletionCannotCreateEarningsWithoutConfirmation() {
    var r = mock(Ride.class);
    when(r.getStatus()).thenReturn(RideStatus.DROPPED_OFF);
    var access = mock(RideAccessService.class);
    when(access.findRideForCompanyScope(1L)).thenReturn(r);
    var evidence = mock(TripEvidenceService.class);
    doThrow(missing()).when(evidence).requireComplete(r);
    var earnings = mock(DriverEarningsService.class);
    var rides = mock(RideRepository.class);
    var service =
        new RideService(
            rides, access, null, null, null, null, null, null, null, null, null, earnings,
            evidence);
    org.springframework.test.util.ReflectionTestUtils.setField(service, "dispatchTenants", tenants());
    assertThatThrownBy(() -> service.completeCompanyRide(1L)).isInstanceOf(ApiException.class);
    verifyNoInteractions(earnings);
    verify(rides, never()).save(any());
  }

  @Test
  void driverCompletionCannotCreateEarningsWithoutConfirmation() {
    var r = mock(Ride.class);
    when(r.getStatus()).thenReturn(RideStatus.DROPPED_OFF);
    var access = mock(DriverPortalAccessService.class);
    when(access.requireAssignedRide(1L)).thenReturn(r);
    var evidence = mock(TripEvidenceService.class);
    doThrow(missing()).when(evidence).requireComplete(r);
    var earnings = mock(DriverEarningsService.class);
    var service =
        new DriverPortalService(
            access, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, earnings, evidence);
    org.springframework.test.util.ReflectionTestUtils.setField(service, "mutationTenants", tenants());
    var users=mock(CurrentAuthenticatedUserService.class);
    var user=mock(com.transportplatform.tms.common.security.AuthenticatedUser.class);
    when(user.tenantId()).thenReturn("tenant"); when(users.requireCurrentUser()).thenReturn(user);
    org.springframework.test.util.ReflectionTestUtils.setField(service, "currentAuthenticatedUserService", users);
    assertThatThrownBy(() -> service.completeRide(1L)).isInstanceOf(ApiException.class);
    verifyNoInteractions(earnings);
  }

  @Test
  void directEarningsCreationAndBillingResolutionAlsoRequireEvidence() {
    var r = mock(Ride.class);
    var evidence = mock(TripEvidenceService.class);
    doThrow(missing()).when(evidence).requireBillable(r);
    var ledger = mock(DriverEarningsLedgerRepository.class);
    var service =
        new DriverEarningsService(
            ledger,
            mock(InvoiceLineItemRepository.class),
            mock(TenantSettingsRepository.class),
            mock(DriverPortalAccessService.class),
            mock(CurrentAuthenticatedUserService.class),
            mock(DriverRepository.class),
            mock(RideRepository.class),
            mock(AuditLogService.class),
            evidence);
    org.springframework.test.util.ReflectionTestUtils.setField(service,"financialLocks",mock(com.transportplatform.tms.common.concurrency.WorkflowLockService.class));
    assertThatThrownBy(() -> service.createForCompletedRide(r)).isInstanceOf(ApiException.class);
    verifyNoInteractions(ledger);
    var rides = mock(RideRepository.class);
    when(rides.findByIdAndTenantId(1L, "tenant")).thenReturn(java.util.Optional.of(r));
    var billing =
        new BillingReferenceValidationService(null, null, null, null, rides, null, evidence);
    assertThat(billing.resolveRide("tenant", 1L))
        .isSameAs(r); // Draft estimates may precede delivery.
    assertThatThrownBy(() -> billing.resolveBillableRide("tenant", 1L))
        .isInstanceOf(ApiException.class);
  }
  private com.transportplatform.tms.features.tenant.domain.TenantRepository tenants() {
    var repository=mock(com.transportplatform.tms.features.tenant.domain.TenantRepository.class);
    when(repository.lockForDispatch(any())).thenReturn(java.util.Optional.of(new com.transportplatform.tms.features.tenant.domain.Tenant()));
    return repository;
  }
}
