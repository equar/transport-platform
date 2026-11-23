package com.transportplatform.tms.features.report.application;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.report.domain.ReportType;
import com.transportplatform.tms.features.saas.application.TenantModulePolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class ReportAccessRegressionTest {
    @Test void billingAndComplianceAreLimitedToTheirOwnReportCategories() {
        var current=mock(CurrentAuthenticatedUserService.class);var access=new ReportAccessService(current,mock(TenantModulePolicy.class));
        when(current.requireCurrentUser()).thenReturn(user("ROLE_BILLING_ADMIN"));
        assertEquals("tenant-a",access.requireReport(ReportType.INVOICE).tenantId());
        access.requireReport(ReportType.PAYMENT);
        assertThrows(ApiException.class,()->access.requireReport(ReportType.RIDER));
        assertThrows(ApiException.class,()->access.requireReport(ReportType.COMPLIANCE));
        when(current.requireCurrentUser()).thenReturn(user("ROLE_COMPLIANCE_ADMIN"));
        access.requireReport(ReportType.COMPLIANCE);access.requireReport(ReportType.INCIDENT);
        assertThrows(ApiException.class,()->access.requireReport(ReportType.INVOICE));
    }
    private AuthenticatedUser user(String role) {return new AuthenticatedUser(1L,"tenant-a","a@example.test","A","User","",true,true,false,List.of(new SimpleGrantedAuthority(role)));}
}
