package com.transportplatform.tms.features.branding.application;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.audit.application.*;
import com.transportplatform.tms.features.compliance.domain.*;
import com.transportplatform.tms.features.settings.application.CompanySettingsService;
import com.transportplatform.tms.features.settings.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantBrandingService {
    public record ThemeState(String tenantId, String companyName, String selectedCode, boolean eligible,
            String eligibilityMessage, List<TenantThemePreset> themes) {}
    private final CurrentAuthenticatedUserService current;
    private final TenantRepository tenants;
    private final TenantSettingsRepository settings;
    private final TenantTransportComplianceRepository compliance;
    private final AuditLogService audit;
    public TenantBrandingService(CurrentAuthenticatedUserService current, TenantRepository tenants,
            TenantSettingsRepository settings, TenantTransportComplianceRepository compliance, AuditLogService audit) {
        this.current = current; this.tenants = tenants; this.settings = settings; this.compliance = compliance; this.audit = audit;
    }
    public String currentTenantId() {
        var user = current.requireCurrentUser();
        if (!hasRole(user, "ROLE_TENANT_ADMIN") || user.tenantId() == null) throw forbidden();
        return user.tenantId();
    }
    @Transactional(readOnly = true)
    public ThemeState get(String tenantId) {
        authorize(tenantId);
        Tenant tenant = tenants.findById(tenantId).orElseThrow(this::notFound);
        return state(tenant, settings.findById(tenantId).orElse(null));
    }
    @Transactional
    public ThemeState apply(String tenantId, String code) {
        authorize(tenantId);
        Tenant tenant = tenants.lockForDispatch(tenantId).orElseThrow(this::notFound);
        if (!eligible(tenant)) throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                "Themes are available after the tenant is active and its transport compliance is verified.");
        TenantThemePreset preset = TenantThemePreset.ALL.stream().filter(theme -> theme.code().equals(code))
                .findFirst().orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, "Choose a theme from the predefined catalog."));
        TenantSettings row = settings.findById(tenantId).orElseGet(() -> CompanySettingsService.defaultSettings(tenantId));
        String previous = TenantThemePreset.selectedCode(row);
        row.setPrimaryColor(preset.code().equals("DEFAULT") ? null : preset.primaryColor());
        row.setSecondaryColor(preset.code().equals("DEFAULT") ? null : preset.secondaryColor());
        row.setAccentColor(preset.code().equals("DEFAULT") ? null : preset.accentColor());
        settings.save(row);
        audit.record(new AuditLogCommand(null, tenantId, "SETTINGS", "THEME_APPLIED", "TENANT_SETTINGS", tenantId,
                "Tenant theme changed to " + preset.name() + ".", Map.of("themeCode", previous), Map.of("themeCode", preset.code())));
        return state(tenant, row);
    }
    private ThemeState state(Tenant tenant, TenantSettings row) {
        boolean eligible = eligible(tenant);
        return new ThemeState(tenant.getId(), tenant.getCompanyName(), TenantThemePreset.selectedCode(row), eligible,
                eligible ? null : "Activate the tenant and verify its transport compliance to apply a theme.", TenantThemePreset.ALL);
    }
    private boolean eligible(Tenant tenant) {
        return tenant.getStatus() == TenantStatus.ACTIVE && compliance.findById(tenant.getId())
                .filter(profile -> profile.getVerificationStatus() == TransportVerificationStatus.VERIFIED).isPresent();
    }
    private void authorize(String tenantId) {
        var user = current.requireCurrentUser();
        if (hasRole(user, "ROLE_PLATFORM_ADMIN")) return;
        if (!hasRole(user, "ROLE_TENANT_ADMIN") || !Objects.equals(user.tenantId(), tenantId)) throw forbidden();
    }
    private boolean hasRole(AuthenticatedUser user, String role) {
        return user.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals(role));
    }
    private ApiException forbidden() { return new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN, "Administrator access to this tenant is required."); }
    private ApiException notFound() { return new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, "Tenant was not found."); }
}
