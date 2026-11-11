package com.transportplatform.tms.features.companyapplication.api;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.transportplatform.tms.features.companyapplication.application.TenantEmailVerificationService;
import com.transportplatform.tms.features.companyapplication.application.ApplicationEmailVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class TenantEmailVerificationControllerTest {
    private final TenantEmailVerificationService service = mock(TenantEmailVerificationService.class);
    private final ApplicationEmailVerificationService applicationService = mock(ApplicationEmailVerificationService.class);
    private MockMvc mvc;
    private final String token = "A".repeat(43);

    @BeforeEach void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new TenantEmailVerificationController(service,
                applicationService)).build();
    }

    @Test void requiresPasswordBeforeConsumingVerificationToken() throws Exception {
        mvc.perform(post("/v1/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + token + "\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/v1/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + token + "\",\"password\":\"short\"}")).andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test void createsPasswordUsingTheLinkWithoutRequiringEmail() throws Exception {
        when(service.verify(token, "My-new-password")).thenReturn("Password created and email verified.");
        mvc.perform(post("/v1/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + token + "\",\"password\":\"My-new-password\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("Password created and email verified."));
        verify(service).verify(token, "My-new-password");
    }

    @Test void rejectsMalformedTokens() throws Exception {
        mvc.perform(post("/v1/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"invalid\",\"password\":\"My-new-password\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test void applicantVerificationRequiresOnlyTokenAndNeverCreatesPassword() throws Exception {
        when(applicationService.verify(token)).thenReturn("Ready for review.");
        mvc.perform(post("/v1/auth/verify-application-email").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + token + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data").value("Ready for review."));
        verify(applicationService).verify(token);
        verifyNoInteractions(service);
    }

    @Test void applicantResendRequiresApplicationReference() throws Exception {
        when(applicationService.resend("APP-1")).thenReturn("Replacement requested.");
        mvc.perform(post("/v1/auth/resend-application-verification").contentType(MediaType.APPLICATION_JSON)
                .content("{\"applicationNumber\":\"APP-1\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data").value("Replacement requested."));
        verify(applicationService).resend("APP-1");
        verifyNoInteractions(service);
    }
}
