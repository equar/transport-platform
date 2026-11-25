package com.transportplatform.tms.common.security;
import com.transportplatform.tms.features.saas.application.TenantModulePolicy;
import com.transportplatform.tms.common.exception.ApiException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.util.UrlPathHelper;
import java.io.IOException;
import java.util.*;
@Component
public class TenantModuleAccessFilter extends OncePerRequestFilter {
    @org.springframework.beans.factory.annotation.Autowired
    private com.transportplatform.tms.features.saas.application.TenantEntitlementService entitlements;

    public static final String ACCESS_STAMP = TenantModuleAccessFilter.class.getName() + ".access";
    public record AccessStamp(Long user, String tenant, String method, String path) {}
    private final TenantModulePolicy policy;
    private final RestAccessDeniedHandler denied;
    public TenantModuleAccessFilter(TenantModulePolicy policy, RestAccessDeniedHandler denied) { this.policy = policy; this.denied = denied; }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user && user.tenantId() != null) {
            // Decode paths the same way as MVC; encoded route segments must not bypass the policy.
            String path = UrlPathHelper.defaultInstance.getPathWithinApplication(request);
            if (!path.equals("/v1/auth/logout")) {
                try { entitlements.requireRequestAccess(user, request.getMethod(), path); }
                catch (ApiException unavailable) { denied.handle(request, response, new AccessDeniedException(entitlements.isPaymentRestricted(user.tenantId()) ? "Subscription recovery required" : "Subscription unavailable")); return; }
            }
            request.setAttribute(ACCESS_STAMP, new AccessStamp(user.id(), user.tenantId(), request.getMethod(), path));
            Set<String> modules = new LinkedHashSet<>();
            if (path.startsWith("/portal/driver/")) modules.add("PORTAL_DRIVER");
            if (path.startsWith("/portal/rider/")) modules.add("PORTAL_RIDER_GUARDIAN");
            if (path.startsWith("/portal/organization/")) modules.add("PORTAL_ORGANIZATION");
            if (path.startsWith("/company/reports") || path.startsWith("/company/report-exports")) modules.add("REPORTS");
            if (path.startsWith("/company/dispatch")) modules.add("DISPATCH");
            if (path.startsWith("/company/routes") || path.startsWith("/portal/driver/routes")) modules.add("ROUTES");
            if (path.startsWith("/company/recurring-")) modules.add("RECURRING_RIDES");
            if (path.startsWith("/company/compliance") || path.startsWith("/portal/driver/compliance") || path.startsWith("/company/reports/compliance")) modules.add("COMPLIANCE");
            if (path.startsWith("/company/incidents") || path.startsWith("/company/reports/incidents")) modules.add("INCIDENTS");
            if (path.startsWith("/notifications") || path.startsWith("/company/notification-templates") || path.startsWith("/portal/push-token")) modules.add("NOTIFICATIONS");
            if (path.matches("/(company|portal/rider|portal/organization)/(invoices|invoice-line-items|payments|receivables|pricing-rules|collections|billing|credit-notes)(/.*)?")
                    || path.matches("/company/reports/(invoices|payments)(/.*)?")
                    || path.matches("/company/(driver-earnings|driver-payouts)(/.*)?")
                    || path.matches("/company/drivers/[^/]+/payouts")) modules.add("BILLING");
            if (!modules.isEmpty()) {
                try { policy.requireEnabled(user.tenantId(), modules.toArray(String[]::new)); }
                catch (ApiException unavailable) { denied.handle(request, response, new AccessDeniedException("Disabled module")); return; }
            }
        }
        chain.doFilter(request, response);
    }
}
