package com.transportplatform.tms.features.saas.application;
import com.transportplatform.tms.common.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import java.util.*;
/** Mirrors runtime module resolution without caching authorization across tenants. */
@Component
public class TenantModulePolicy {
    private final TenantFeatureResolutionService features;
    public TenantModulePolicy(TenantFeatureResolutionService features) { this.features = features; }
    public void requireEnabled(String tenantId, String... modules) {
        if (tenantId == null || tenantId.isBlank()) throw denied();
        var resolved = new HashMap<String, Boolean>();
        for (var flag : features.resolveForTenant(tenantId)) {
            resolved.put(flag.flagCode(), flag.enabled()); resolved.put(flag.moduleKey(), flag.enabled());
        }
        for (String module : modules) if (!resolved.getOrDefault(module, true)) throw denied();
    }
    private ApiException denied() { return new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN, "This module is not enabled for your workspace."); }
}
