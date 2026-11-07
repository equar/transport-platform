package com.transportplatform.tms.features.compliance.application;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
class ComplianceAccessServiceTest {
    final CurrentAuthenticatedUserService current=mock(CurrentAuthenticatedUserService.class);
    final ComplianceIssueRepository issues=mock(ComplianceIssueRepository.class);
    final ComplianceAccessService service=new ComplianceAccessService(current,issues);
    AuthenticatedUser user(RoleName role,String tenant) { return new AuthenticatedUser(1L,tenant,"qa@example.test","Test","User","",true,true,false,List.of(new SimpleGrantedAuthority(role.name()))); }
    @Test void complianceAndTenantAdministratorsCanAccessTheirWorkspace() {
        for(var role:List.of(RoleName.ROLE_TENANT_ADMIN,RoleName.ROLE_COMPLIANCE_ADMIN)) {
            var user=user(role,"tenant-a");when(current.requireCurrentUser()).thenReturn(user);
            assertThat(service.requireCompanyAdmin()).isSameAs(user);
        }
    }
    @Test void unrelatedRolesAndMissingTenantRemainDenied() {
        for(var role:List.of(RoleName.ROLE_DISPATCHER,RoleName.ROLE_BILLING_ADMIN,RoleName.ROLE_DRIVER,RoleName.ROLE_PLATFORM_ADMIN)) {
            when(current.requireCurrentUser()).thenReturn(user(role,"tenant-a"));
            assertThatThrownBy(service::requireCompanyAdmin).isInstanceOf(ApiException.class);
        }
        when(current.requireCurrentUser()).thenReturn(user(RoleName.ROLE_COMPLIANCE_ADMIN,null));
        assertThatThrownBy(service::requireCompanyAdmin).isInstanceOf(ApiException.class);
    }
    @Test void complianceIssueLookupStillRequiresTheAuthenticatedTenant() {
        when(current.requireCurrentUser()).thenReturn(user(RoleName.ROLE_COMPLIANCE_ADMIN,"tenant-a"));
        when(issues.findByIdAndTenantId(99L,"tenant-a")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.findCompanyIssue(99L)).isInstanceOf(ApiException.class);
        verify(issues).findByIdAndTenantId(99L,"tenant-a");verifyNoMoreInteractions(issues);
    }
}
