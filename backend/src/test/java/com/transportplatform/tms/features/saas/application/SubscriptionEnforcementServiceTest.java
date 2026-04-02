package com.transportplatform.tms.features.saas.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlan;
import com.transportplatform.tms.features.saas.domain.TenantSubscription;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionRepository;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SubscriptionEnforcementServiceTest {

    @Mock
    private TenantSubscriptionRepository tenantSubscriptionRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private DriverRepository driverRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private RiderRepository riderRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    private final Clock clock = Clock.fixed(Instant.parse("2026-04-02T00:00:00Z"), ZoneOffset.UTC);

    private SubscriptionEnforcementService subscriptionEnforcementService;

    @BeforeEach
    void setUp() {
        subscriptionEnforcementService = new SubscriptionEnforcementService(tenantSubscriptionRepository,
                appUserRepository,
                driverRepository,
                vehicleRepository,
                riderRepository,
                organizationRepository,
                clock);
    }

    @Test
    void allowsUserCreationWhenSubscriptionIsActiveAndUnderQuota() {
        when(tenantSubscriptionRepository.findFirstByTenant_IdAndStatusInOrderByEffectiveStartDateDescCreatedAtDesc(
                "tenant-123",
                Set.of(TenantSubscriptionStatus.ACTIVE, TenantSubscriptionStatus.TRIAL,
                        TenantSubscriptionStatus.SUSPENDED)))
                .thenReturn(Optional.of(
                        buildSubscription(TenantSubscriptionStatus.ACTIVE, 5, LocalDate.of(2026, 3, 1), null, null)));
        when(appUserRepository.countByTenantId("tenant-123")).thenReturn(4L);

        assertDoesNotThrow(() -> subscriptionEnforcementService.requireUserCreationAllowed("tenant-123"));
    }

    @Test
    void rejectsUserCreationWhenSubscriptionIsSuspended() {
        when(tenantSubscriptionRepository.findFirstByTenant_IdAndStatusInOrderByEffectiveStartDateDescCreatedAtDesc(
                "tenant-123",
                Set.of(TenantSubscriptionStatus.ACTIVE, TenantSubscriptionStatus.TRIAL,
                        TenantSubscriptionStatus.SUSPENDED)))
                .thenReturn(Optional.of(buildSubscription(TenantSubscriptionStatus.SUSPENDED, 5,
                        LocalDate.of(2026, 3, 1), null, null)));

        ApiException exception = assertThrows(ApiException.class,
                () -> subscriptionEnforcementService.requireUserCreationAllowed("tenant-123"));

        assertEquals("FORBIDDEN", exception.getErrorCode().name());
    }

    @Test
    void rejectsUserCreationWhenSubscriptionHasNoRemainingSeats() {
        when(tenantSubscriptionRepository.findFirstByTenant_IdAndStatusInOrderByEffectiveStartDateDescCreatedAtDesc(
                "tenant-123",
                Set.of(TenantSubscriptionStatus.ACTIVE, TenantSubscriptionStatus.TRIAL,
                        TenantSubscriptionStatus.SUSPENDED)))
                .thenReturn(Optional.of(
                        buildSubscription(TenantSubscriptionStatus.ACTIVE, 5, LocalDate.of(2026, 3, 1), null, null)));
        when(appUserRepository.countByTenantId("tenant-123")).thenReturn(5L);

        ApiException exception = assertThrows(ApiException.class,
                () -> subscriptionEnforcementService.requireUserCreationAllowed("tenant-123"));

        assertEquals("RESOURCE_CONFLICT", exception.getErrorCode().name());
    }

    @Test
    void rejectsUserCreationWhenTrialHasExpired() {
        when(tenantSubscriptionRepository.findFirstByTenant_IdAndStatusInOrderByEffectiveStartDateDescCreatedAtDesc(
                "tenant-123",
                Set.of(TenantSubscriptionStatus.ACTIVE, TenantSubscriptionStatus.TRIAL,
                        TenantSubscriptionStatus.SUSPENDED)))
                .thenReturn(Optional.of(buildSubscription(TenantSubscriptionStatus.TRIAL, 5, LocalDate.of(2026, 3, 1),
                        null, LocalDate.of(2026, 4, 1))));

        ApiException exception = assertThrows(ApiException.class,
                () -> subscriptionEnforcementService.requireUserCreationAllowed("tenant-123"));

        assertEquals("FORBIDDEN", exception.getErrorCode().name());
    }

    private TenantSubscription buildSubscription(TenantSubscriptionStatus status,
            int maxUsers,
            LocalDate effectiveStartDate,
            LocalDate effectiveEndDate,
            LocalDate trialEndDate) {
        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setMaxUsers(maxUsers);

        TenantSubscription subscription = new TenantSubscription();
        subscription.setSubscriptionPlan(plan);
        subscription.setStatus(status);
        subscription.setEffectiveStartDate(effectiveStartDate);
        subscription.setEffectiveEndDate(effectiveEndDate);
        subscription.setTrialEndDate(trialEndDate);
        subscription.setTrial(status == TenantSubscriptionStatus.TRIAL);
        return subscription;
    }
}