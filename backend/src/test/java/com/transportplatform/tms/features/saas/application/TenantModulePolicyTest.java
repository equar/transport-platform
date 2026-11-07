package com.transportplatform.tms.features.saas.application;
import com.transportplatform.tms.common.exception.ApiException;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class TenantModulePolicyTest {
    @Test void disabledModuleCannotBeReenabledByChangingTenantContextOrReusingAnotherTenantsResult() {
        var features = mock(TenantFeatureResolutionService.class);
        when(features.resolveForTenant("tenant-a")).thenReturn(List.of(new TenantFeatureResolutionService.ResolvedFeatureFlag(1L,"BILLING","Billing","BILLING",false,true,null)));
        when(features.resolveForTenant("tenant-b")).thenReturn(List.of());
        var policy = new TenantModulePolicy(features);
        assertThrows(ApiException.class, () -> policy.requireEnabled("tenant-a", "BILLING"));
        assertDoesNotThrow(() -> policy.requireEnabled("tenant-b", "BILLING"));
        assertThrows(ApiException.class, () -> policy.requireEnabled("tenant-a", "BILLING"));
        assertThrows(ApiException.class, () -> policy.requireEnabled(null, "BILLING"));
    }
}
