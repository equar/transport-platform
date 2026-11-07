package com.transportplatform.tms.common.observability;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
@Component
public class WorkflowMetricsFilter extends OncePerRequestFilter {
    private final MeterRegistry registry;
    public WorkflowMetricsFilter(org.springframework.beans.factory.ObjectProvider<MeterRegistry> registry) {this.registry=registry.getIfAvailable();}
    protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        try {chain.doFilter(request,response);}
        finally {
            if(registry!=null) {
            String path=request.getServletPath();
            if("POST".equals(request.getMethod()) && path.equals("/portal/rider/rides"))
                registry.counter("transport.booking.requests","outcome",response.getStatus()<400?"accepted":"failed").increment();
            if((path.endsWith("/resources") || path.endsWith("/assign-driver") || path.endsWith("/assign-vehicle") || path.endsWith("/assign-resources")) && !"GET".equals(request.getMethod()))
                registry.counter("transport.assignment.requests","outcome",response.getStatus()==409?"conflict":response.getStatus()<400?"accepted":"failed").increment();
            }
        }
    }
}
