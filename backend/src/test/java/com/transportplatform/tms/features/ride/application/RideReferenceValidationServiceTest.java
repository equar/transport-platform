package com.transportplatform.tms.features.ride.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.organization.domain.Contract;
import com.transportplatform.tms.features.organization.domain.ContractRepository;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.organization.domain.ServiceAreaRepository;
import com.transportplatform.tms.features.rider.domain.GuardianRepository;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderGuardianRepository;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import java.lang.reflect.Field;
import java.util.Optional;
import java.time.Clock;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RideReferenceValidationServiceTest {

    @Mock
    private RiderRepository riderRepository;

    @Mock
    private GuardianRepository guardianRepository;

    @Mock
    private RiderGuardianRepository riderGuardianRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ServiceAreaRepository serviceAreaRepository;

    @Test
    void resolveRejectsInactiveRider() {
        RideReferenceValidationService service = new RideReferenceValidationService(
                riderRepository,
                guardianRepository,
                riderGuardianRepository,
                organizationRepository,
                contractRepository,
                serviceAreaRepository,
                Clock.systemUTC());

        Rider rider = new Rider();
        rider.setTenantId("tenant-123");
        rider.setRiderCode("RID-000123");
        rider.setRiderType(RiderType.STUDENT);
        rider.setFirstName("Taylor");
        rider.setLastName("Jordan");
        rider.setPrimaryPhone("5551112222");
        rider.setStatus(RiderStatus.PENDING);

        when(riderRepository.findByIdAndTenantId(11L, "tenant-123")).thenReturn(Optional.of(rider));

        ApiException exception = assertThrows(ApiException.class,
                () -> service.resolve("tenant-123", 11L, null, null, null, null));

        assertEquals("VALIDATION_FAILED", exception.getErrorCode().name());
    }

    @Test
    void resolveRejectsContractOutsideSelectedOrganization() throws Exception {
        RideReferenceValidationService service = new RideReferenceValidationService(
                riderRepository,
                guardianRepository,
                riderGuardianRepository,
                organizationRepository,
                contractRepository,
                serviceAreaRepository,
                Clock.systemUTC());

        Rider rider = new Rider();
        rider.setTenantId("tenant-123");
        rider.setRiderCode("RID-000123");
        rider.setRiderType(RiderType.STUDENT);
        rider.setFirstName("Taylor");
        rider.setLastName("Jordan");
        rider.setPrimaryPhone("5551112222");
        rider.setStatus(RiderStatus.ACTIVE);

        Organization selectedOrganization = new Organization();
        setId(selectedOrganization, 100L);
        selectedOrganization.setName("Selected Org");

        Organization contractOrganization = new Organization();
        setId(contractOrganization, 200L);
        contractOrganization.setName("Different Org");

        Contract contract = new Contract();
        contract.setStatus(ContractStatus.ACTIVE);
        contract.setOrganization(contractOrganization);

        when(riderRepository.findByIdAndTenantId(11L, "tenant-123")).thenReturn(Optional.of(rider));
        when(organizationRepository.findByIdAndTenantId(100L, "tenant-123"))
                .thenReturn(Optional.of(selectedOrganization));
        when(contractRepository.findByIdAndTenantId(300L, "tenant-123")).thenReturn(Optional.of(contract));

        ApiException exception = assertThrows(ApiException.class,
                () -> service.resolve("tenant-123", 11L, null, 100L, 300L, null));

        assertEquals("VALIDATION_FAILED", exception.getErrorCode().name());
    }

    @Test
    void resolveUsesContractOrganizationWhenOrganizationNotProvided() {
        RideReferenceValidationService service = new RideReferenceValidationService(
                riderRepository,
                guardianRepository,
                riderGuardianRepository,
                organizationRepository,
                contractRepository,
                serviceAreaRepository,
                Clock.systemUTC());

        Rider rider = new Rider();
        rider.setTenantId("tenant-123");
        rider.setRiderCode("RID-000123");
        rider.setRiderType(RiderType.STUDENT);
        rider.setFirstName("Taylor");
        rider.setLastName("Jordan");
        rider.setPrimaryPhone("5551112222");
        rider.setStatus(RiderStatus.ACTIVE);

        Organization contractOrganization = new Organization();
        contractOrganization.setName("Contract Org");

        Contract contract = new Contract();
        contract.setStatus(ContractStatus.ACTIVE);
        contract.setOrganization(contractOrganization);

        when(riderRepository.findByIdAndTenantId(11L, "tenant-123")).thenReturn(Optional.of(rider));
        when(contractRepository.findByIdAndTenantId(300L, "tenant-123")).thenReturn(Optional.of(contract));

        RideReferenceValidationService.ResolvedReferences resolved = service.resolve(
                "tenant-123",
                11L,
                null,
                null,
                300L,
                null);

        assertNotNull(resolved.organization());
        assertEquals("Contract Org", resolved.organization().getName());
    }

    private void setId(Object target, Long value) throws Exception {
        Field field = target.getClass().getDeclaredField("id");
        field.setAccessible(true);
        field.set(target, value);
    }
}
