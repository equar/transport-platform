package com.transportplatform.tms.common.security;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentAuthenticatedUserService {
    @org.springframework.beans.factory.annotation.Autowired
    private com.transportplatform.tms.features.saas.application.TenantEntitlementService entitlements;


    public AuthenticatedUser requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new ApiException(
                    ErrorCode.UNAUTHORIZED,
                    HttpStatus.UNAUTHORIZED,
                    "An authenticated user is required to access this resource.");
        }
        if (user.tenantId() != null) {
            var attributes = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes instanceof org.springframework.web.context.request.ServletRequestAttributes servlet) {
                var request = servlet.getRequest();
                String path = org.springframework.web.util.UrlPathHelper.defaultInstance.getPathWithinApplication(request);
                var stamp = new TenantModuleAccessFilter.AccessStamp(user.id(), user.tenantId(), request.getMethod(), path);
                if (!stamp.equals(request.getAttribute(TenantModuleAccessFilter.ACCESS_STAMP)))
                    entitlements.requireRequestAccess(user, request.getMethod(), path);
            } else entitlements.requireOperational(user.tenantId());
        }
        return user;
    }
}