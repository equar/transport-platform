package com.transportplatform.tms.common.observability;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;

class RequestCorrelationFilterTest {

    private final RequestCorrelationFilter filter = new RequestCorrelationFilter();

    @Test
    void preservesIncomingCorrelationIdAndSetsResponseHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestCorrelationFilter.HEADER_NAME, "client-correlation-id");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> mdcValueInChain = new AtomicReference<>();

        FilterChain chain = (req, res) -> mdcValueInChain.set(MDC.get(RequestCorrelationFilter.MDC_KEY));

        filter.doFilter(request, response, chain);

        assertThat(response.getHeader(RequestCorrelationFilter.HEADER_NAME)).isEqualTo("client-correlation-id");
        assertThat(mdcValueInChain.get()).isEqualTo("client-correlation-id");
        assertThat(MDC.get(RequestCorrelationFilter.MDC_KEY)).isNull();
    }

    @Test
    void generatesCorrelationIdWhenMissing() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> mdcValueInChain = new AtomicReference<>();

        FilterChain chain = (req, res) -> {
            mdcValueInChain.set(MDC.get(RequestCorrelationFilter.MDC_KEY));
            assertThat(((HttpServletResponse) res).getHeader(RequestCorrelationFilter.HEADER_NAME)).isNotBlank();
        };

        filter.doFilter(request, response, chain);

        String correlationId = response.getHeader(RequestCorrelationFilter.HEADER_NAME);
        assertThat(correlationId).isNotBlank();
        assertThat(mdcValueInChain.get()).isEqualTo(correlationId);
        assertThat(MDC.get(RequestCorrelationFilter.MDC_KEY)).isNull();
    }
}
