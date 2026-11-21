package com.transportplatform.tms.features.compliance.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.compliance.domain.*;

import org.junit.jupiter.api.Test;

import java.time.Clock;

class ComplianceServiceTest {
    @Test
    void criticalComplianceIssuesCannotBeDismissedEvenByAnAuthorizedAdministrator() {
        var repository = mock(ComplianceIssueRepository.class);
        var access = mock(ComplianceAccessService.class);
        var service =
                new ComplianceService(
                        repository,
                        access,
                        mock(ComplianceIssueSyncService.class),
                        mock(ComplianceIssueMapper.class),
                        mock(AuditLogService.class),
                        Clock.systemUTC());
        var issue = new ComplianceIssue();
        issue.setSeverity(ComplianceIssueSeverity.CRITICAL);
        issue.setIssueStatus(ComplianceIssueStatus.OPEN);
        when(access.findCompanyIssue(1L)).thenReturn(issue);
        assertThatThrownBy(() -> service.dismissCompanyIssue(1L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("cannot be dismissed");
        verifyNoInteractions(repository);
    }
}
