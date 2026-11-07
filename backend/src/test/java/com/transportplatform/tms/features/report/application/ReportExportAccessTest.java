package com.transportplatform.tms.features.report.application;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class ReportExportAccessTest {
    @Test void unknownOrOtherTenantExportCannotBeDownloaded() {
        var jdbc=mock(JdbcTemplate.class);var current=mock(CurrentAuthenticatedUserService.class);
        when(current.requireCurrentUser()).thenReturn(new AuthenticatedUser(7L,"tenant-a","a@example.com","A","User","",true,true,false,List.of()));
        var service=new ReportExportService(jdbc,new ObjectMapper(),current,mock(AppUserRepository.class),mock(TenantRepository.class),mock(ReportService.class),Clock.fixed(Instant.parse("2026-11-06T12:00:00Z"),ZoneOffset.UTC));
        ApiException error=assertThrows(ApiException.class,()->service.download("other-export"));
        assertEquals("RESOURCE_NOT_FOUND",error.getErrorCode().name());
        verify(jdbc).queryForList("SELECT id,status,progress,error_message,expires_at FROM report_export_jobs WHERE id=? AND tenant_id=? AND user_id=? AND expires_at>?","other-export","tenant-a",7L,java.sql.Timestamp.from(Instant.parse("2026-11-06T12:00:00Z")));
        verifyNoMoreInteractions(jdbc);
    }
    @Test void rejectsUnboundedExportBeforeQueuingWork() {
        var current=mock(CurrentAuthenticatedUserService.class);var jdbc=mock(JdbcTemplate.class);
        var service=new ReportExportService(jdbc,new ObjectMapper(),current,mock(AppUserRepository.class),mock(TenantRepository.class),mock(ReportService.class),Clock.systemUTC());
        assertThrows(ApiException.class,()->service.create(new ReportExportService.Request(com.transportplatform.tms.features.report.domain.ReportType.RIDE,Map.of())));
        verifyNoInteractions(jdbc);
    }
}
