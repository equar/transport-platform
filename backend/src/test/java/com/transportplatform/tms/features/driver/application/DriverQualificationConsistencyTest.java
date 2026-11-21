package com.transportplatform.tms.features.driver.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.transportplatform.tms.features.driver.domain.*;
import com.transportplatform.tms.features.settings.application.TenantTimeService;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.*;
import java.util.*;

class DriverQualificationConsistencyTest {
    @Test
    void verifiedDocumentsDoNotMaskIncompleteTrainingOrContradictoryQualifications() {
        var repository = mock(DriverDocumentRepository.class);
        var time = mock(TenantTimeService.class);
        var today = LocalDate.of(2026, 11, 20);
        when(time.today("tenant")).thenReturn(today);
        var service = new DriverComplianceSummaryService(repository, Clock.systemUTC(), time);
        var driver = new Driver();
        ReflectionTestUtils.setField(driver, "id", 1L);
        driver.setLicenseExpiryDate(today.plusYears(1));
        driver.setBackgroundCheckStatus(DriverQualificationStatus.CLEAR);
        driver.setBackgroundCheckExpiryDate(today.plusYears(1));
        driver.setDrugTestStatus(DriverQualificationStatus.CLEAR);
        driver.setDrugTestExpiryDate(today.plusYears(1));
        driver.setTrainingStatus(DriverTrainingStatus.COMPLETED);
        var docs = new ArrayList<DriverDocument>();
        for (var type : service.getRequiredDocumentTypes()) {
            var doc = new DriverDocument();
            doc.setDriver(driver);
            doc.setDocumentType(type);
            doc.setStatus(DriverDocumentStatus.ACTIVE);
            doc.setVerificationStatus(DriverDocumentVerificationStatus.VERIFIED);
            doc.setExpiryDate(today.plusYears(1));
            docs.add(doc);
        }
        when(repository.findAllByTenantIdAndDriver_IdIn("tenant", List.of(1L))).thenReturn(docs);
        assertThat(service.getSummary("tenant", driver).overallStatus())
                .isEqualTo(DriverComplianceStatus.COMPLIANT);
        driver.setTrainingStatus(DriverTrainingStatus.NOT_STARTED);
        assertThat(service.getSummary("tenant", driver).qualificationIssues())
                .contains("TRAINING_INCOMPLETE");
        driver.setTrainingStatus(DriverTrainingStatus.COMPLETED);
        driver.setLicenseExpiryDate(today.plusMonths(2));
        assertThat(service.getSummary("tenant", driver).qualificationIssues())
                .contains("DRIVER_LICENSE_RECORD_DOCUMENT_MISMATCH");
        driver.setBackgroundCheckStatus(DriverQualificationStatus.FAILED);
        assertThat(service.getSummary("tenant", driver).overallStatus())
                .isEqualTo(DriverComplianceStatus.NON_COMPLIANT);
    }
}
