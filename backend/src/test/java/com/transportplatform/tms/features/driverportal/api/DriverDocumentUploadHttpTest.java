package com.transportplatform.tms.features.driverportal.api;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.transportplatform.tms.common.exception.GlobalExceptionHandler;
import com.transportplatform.tms.features.driver.domain.*;
import com.transportplatform.tms.features.driverportal.application.*;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalDocumentResponse;
import com.transportplatform.tms.features.location.application.DriverLocationSnapshotService;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class DriverDocumentUploadHttpTest {
    final DriverPortalService service = mock(DriverPortalService.class);
    final MockMvc mvc = MockMvcBuilders.standaloneSetup(new DriverPortalController(service,
            mock(DriverLocationSnapshotService.class), mock(DriverActionIdempotencyService.class)))
            .setControllerAdvice(new GlobalExceptionHandler())
            .setMessageConverters(new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter(
                    org.springframework.http.converter.json.Jackson2ObjectMapperBuilder.json()
                            .featuresToDisable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS).build()))
            .build();
    final MockMultipartFile file = new MockMultipartFile("file", "license.pdf", "application/pdf", "%PDF-1.4".getBytes());

    @Test void multipartPreservesMetadataAndIsoDates() throws Exception {
        var issued = LocalDate.of(2026, 11, 8); var expires = LocalDate.of(2027, 11, 8);
        when(service.uploadDocument(eq(DriverDocumentType.DRIVER_LICENSE), eq("DL-123"), eq("State DMV"),
                eq(issued), eq(expires), isNull(), any())).thenReturn(new DriverPortalDocumentResponse(1L,
                        DriverDocumentType.DRIVER_LICENSE, "license.pdf", "DL-123", "State DMV", issued, expires,
                        DriverDocumentVerificationStatus.PENDING, DriverDocumentStatus.ACTIVE, null));
        mvc.perform(multipart("/portal/driver/documents").file(file).param("documentType", "DRIVER_LICENSE")
                .param("documentNumber", "DL-123").param("issuingAuthority", "State DMV")
                .param("issueDate", "2026-11-08").param("expiryDate", "2027-11-08"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.documentNumber").value("DL-123"))
                .andExpect(jsonPath("$.data.issuingAuthority").value("State DMV"))
                .andExpect(jsonPath("$.data.issueDate").value("2026-11-08"));
    }
    @Test void missingMetadataAndInvalidDatesReturnValidationErrorsRatherThan500() throws Exception {
        mvc.perform(multipart("/portal/driver/documents").file(file).param("documentType", "DRIVER_LICENSE"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
        mvc.perform(multipart("/portal/driver/documents").file(file).param("documentType", "DRIVER_LICENSE")
                .param("documentNumber", "DL-123").param("issuingAuthority", "State DMV")
                .param("issueDate", "invalid").param("expiryDate", "2027-11-08"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.details.field").value("issueDate"));
        verifyNoInteractions(service);
    }
}
