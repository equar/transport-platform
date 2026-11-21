package com.transportplatform.tms.common.exception;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.billing.api.request.*;
import com.transportplatform.tms.features.billing.domain.PaymentMethod;
import com.transportplatform.tms.features.report.application.*;
import com.transportplatform.tms.features.report.domain.ReportType;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import org.springframework.web.bind.MissingRequestHeaderException;

class ReviewErrorContractTest {
    @Test void paymentPrecisionAndBoundsAreFieldValidationErrors() {
        try(var factory=jakarta.validation.Validation.buildDefaultValidatorFactory()) {
            var validator=factory.getValidator();
            for(String amount:List.of("10.001","10000000000.00")) {
                var request=new PaymentUpsertRequest(1L,LocalDate.now(),new BigDecimal(amount),PaymentMethod.CASH,null,null,null,null,null,true);
                assertTrue(validator.validate(request).stream().anyMatch(error->error.getPropertyPath().toString().equals("amount")));
            }
            assertTrue(validator.validate(new PaymentPreviewRequest(1L,new BigDecimal("0.01"))).isEmpty());
        }
    }
    @Test void invalidExportDateHasAnActionableFieldError() {
        var current=mock(CurrentAuthenticatedUserService.class);
        when(current.requireCurrentUser()).thenReturn(new AuthenticatedUser(1L,"tenant","a@example.test","A","User","",true,true,false,List.of()));
        var service=new ReportExportService(null,null,current,null,null,null,Clock.systemUTC());
        var error=assertThrows(ApiException.class,()->service.create(new ReportExportService.Request(ReportType.RIDE,Map.of("fromDate","2026-99-99","toDate","2026-11-21"))));
        assertEquals(400,error.getStatus().value());
        assertTrue(error.getDetails().toString().contains("YYYY-MM-DD"));
    }
    @Test void missingSubmissionKeyDoesNotAskToRefreshARecord() throws Exception {
        var method=ReviewErrorContractTest.class.getDeclaredMethod("header",String.class);
        var parameter=new org.springframework.core.MethodParameter(method,0);
        var handler=new GlobalExceptionHandler();
        var missing=handler.handleMissingHeader(new MissingRequestHeaderException("Idempotency-Key",parameter));
        assertEquals(400,missing.getStatusCode().value());
        assertTrue(missing.getBody().error().message().contains("submission key"));
        assertEquals(428,handler.handleMissingHeader(new MissingRequestHeaderException("If-Match",parameter)).getStatusCode().value());
    }
    private void header(String header) {}
    @Test void duplicateAndForeignKeyErrorsHaveDifferentRecoveryActions() {
        var handler=new GlobalExceptionHandler();
        var duplicate=handler.handleDataConflict(new org.springframework.dao.DataIntegrityViolationException("private database details",new java.sql.SQLException("private","23000",1062)));
        var linked=handler.handleDataConflict(new org.springframework.dao.DataIntegrityViolationException("private",new java.sql.SQLException("private","23000",1452)));
        assertTrue(duplicate.getBody().error().message().contains("reference already exists"));
        assertTrue(linked.getBody().error().message().contains("linked record"));
        assertFalse(linked.getBody().error().message().contains("private"));
    }
    @Test void databaseFailureInAuthenticationReturnsTheSameApiEnvelope() throws Exception {
        var filter=new ServiceAvailabilityFilter(new com.fasterxml.jackson.databind.ObjectMapper().findAndRegisterModules());
        var response=new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET","/company/rides"),response,(request,result)->{throw new org.springframework.dao.DataAccessResourceFailureException("secret connection string");});
        assertEquals(503,response.getStatus()); assertEquals("30",response.getHeader("Retry-After"));
        assertTrue(response.getContentAsString().contains("SERVICE_UNAVAILABLE"));
        assertFalse(response.getContentAsString().contains("secret"));
    }
}
