package com.transportplatform.tms.common.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class PaginationGuardInterceptorTest {

    private final PaginationGuardInterceptor interceptor = new PaginationGuardInterceptor();

    @Test
    void allowsValidPaginationValues() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setParameter("page", "0");
        request.setParameter("size", "50");

        assertDoesNotThrow(() -> interceptor.preHandle(request, new MockHttpServletResponse(), new Object()));
    }

    @Test
    void rejectsPageSizeAboveMax() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setParameter("size", "201");

        ApiException exception = assertThrows(
                ApiException.class,
                () -> interceptor.preHandle(request, new MockHttpServletResponse(), new Object()));

        assertEquals(ErrorCode.VALIDATION_FAILED, exception.getErrorCode());
    }

    @Test
    void rejectsNegativePage() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setParameter("page", "-1");

        ApiException exception = assertThrows(
                ApiException.class,
                () -> interceptor.preHandle(request, new MockHttpServletResponse(), new Object()));

        assertEquals(ErrorCode.VALIDATION_FAILED, exception.getErrorCode());
    }
}
