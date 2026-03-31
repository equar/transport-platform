package com.transportplatform.tms.features.rider.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.rider.api.request.RiderGuardianUpsertRequest;
import com.transportplatform.tms.features.rider.api.response.RiderGuardianResponse;
import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderGuardian;
import com.transportplatform.tms.features.rider.domain.RiderGuardianRelationshipType;
import com.transportplatform.tms.features.rider.domain.RiderGuardianRepository;
import com.transportplatform.tms.features.rider.domain.RiderGuardianStatus;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class RiderRelationshipServiceTest {

    @Mock
    private RiderGuardianRepository riderGuardianRepository;

    @Mock
    private RiderAccessService riderAccessService;

    @Mock
    private GuardianAccessService guardianAccessService;

    @Mock
    private AuditLogService auditLogService;

    @Test
    void linkRejectsCrossTenantGuardian() {
        Rider rider = rider(10L, "tenant-a");
        Guardian guardian = guardian(20L, "tenant-b");
        RiderRelationshipService riderRelationshipService = new RiderRelationshipService(
                riderGuardianRepository,
                riderAccessService,
                guardianAccessService,
                new RiderGuardianMapper(),
                auditLogService);

        when(riderAccessService.findRiderForCompanyScope(10L)).thenReturn(rider);
        when(guardianAccessService.findGuardianForCompanyScope(20L)).thenReturn(guardian);

        ApiException exception = assertThrows(ApiException.class,
                () -> riderRelationshipService.linkGuardianToRider(10L,
                        new RiderGuardianUpsertRequest(20L,
                                RiderGuardianRelationshipType.PARENT,
                                false,
                                true,
                                false,
                                null)));

        assertEquals("FORBIDDEN", exception.getErrorCode().name());
    }

    @Test
    void firstGuardianLinkBecomesPrimary() {
        Rider rider = rider(10L, "tenant-a");
        Guardian guardian = guardian(20L, "tenant-a");
        RiderRelationshipService riderRelationshipService = new RiderRelationshipService(
                riderGuardianRepository,
                riderAccessService,
                guardianAccessService,
                new RiderGuardianMapper(),
                auditLogService);

        when(riderAccessService.findRiderForCompanyScope(10L)).thenReturn(rider);
        when(guardianAccessService.findGuardianForCompanyScope(20L)).thenReturn(guardian);
        when(riderGuardianRepository.findByTenantIdAndRider_IdAndGuardian_Id("tenant-a", 10L, 20L))
                .thenReturn(Optional.empty());
        when(riderGuardianRepository.findAllByTenantIdAndRider_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                "tenant-a",
                10L,
                RiderGuardianStatus.ACTIVE)).thenReturn(List.of());
        when(riderGuardianRepository.save(any(RiderGuardian.class))).thenAnswer(invocation -> {
            RiderGuardian relationship = invocation.getArgument(0);
            ReflectionTestUtils.setField(relationship, "id", 55L);
            return relationship;
        });

        RiderGuardianResponse response = riderRelationshipService.linkGuardianToRider(10L,
                new RiderGuardianUpsertRequest(20L,
                        RiderGuardianRelationshipType.PARENT,
                        false,
                        true,
                        false,
                        null));

        assertEquals(true, response.primaryGuardian());
        assertEquals(20L, response.guardianId());
    }

    @Test
    void updatingPrimaryGuardianDemotesExistingPrimary() {
        Rider rider = rider(10L, "tenant-a");
        Guardian primaryGuardian = guardian(20L, "tenant-a");
        Guardian secondaryGuardian = guardian(21L, "tenant-a");
        RiderGuardian existingPrimary = relationship(100L, rider, primaryGuardian, true);
        RiderGuardian targetRelationship = relationship(101L, rider, secondaryGuardian, false);
        RiderRelationshipService riderRelationshipService = new RiderRelationshipService(
                riderGuardianRepository,
                riderAccessService,
                guardianAccessService,
                new RiderGuardianMapper(),
                auditLogService);

        when(riderAccessService.requireCompanyTenantId()).thenReturn("tenant-a");
        when(riderGuardianRepository.findByIdAndTenantId(101L, "tenant-a")).thenReturn(Optional.of(targetRelationship));
        when(riderGuardianRepository.findAllByTenantIdAndRider_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                "tenant-a",
                10L,
                RiderGuardianStatus.ACTIVE)).thenReturn(List.of(existingPrimary, targetRelationship));
        when(riderGuardianRepository.save(any(RiderGuardian.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        RiderGuardianResponse response = riderRelationshipService.updateRiderGuardian(101L,
                new RiderGuardianUpsertRequest(21L,
                        RiderGuardianRelationshipType.CAREGIVER,
                        true,
                        true,
                        true,
                        "Updated"));

        verify(riderGuardianRepository).saveAll(eq(List.of(existingPrimary, targetRelationship)));
        assertEquals(false, existingPrimary.isPrimaryGuardian());
        assertEquals(true, response.primaryGuardian());
    }

    private Rider rider(Long id, String tenantId) {
        Rider rider = new Rider();
        ReflectionTestUtils.setField(rider, "id", id);
        rider.setTenantId(tenantId);
        rider.setRiderCode("RID-0001");
        rider.setFirstName("Jordan");
        rider.setLastName("Lee");
        return rider;
    }

    private Guardian guardian(Long id, String tenantId) {
        Guardian guardian = new Guardian();
        ReflectionTestUtils.setField(guardian, "id", id);
        guardian.setTenantId(tenantId);
        guardian.setFirstName("Morgan");
        guardian.setLastName("Lee");
        guardian.setPhone("555 111 2222");
        return guardian;
    }

    private RiderGuardian relationship(Long id, Rider rider, Guardian guardian, boolean primary) {
        RiderGuardian relationship = new RiderGuardian();
        ReflectionTestUtils.setField(relationship, "id", id);
        relationship.setTenantId(rider.getTenantId());
        relationship.setRider(rider);
        relationship.setGuardian(guardian);
        relationship.setRelationshipType(RiderGuardianRelationshipType.PARENT);
        relationship.setPrimaryGuardian(primary);
        relationship.setAuthorizedForPickup(true);
        relationship.setBillingContact(false);
        relationship.setStatus(RiderGuardianStatus.ACTIVE);
        return relationship;
    }
}