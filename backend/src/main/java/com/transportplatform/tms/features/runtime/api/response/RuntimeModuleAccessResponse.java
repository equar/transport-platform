package com.transportplatform.tms.features.runtime.api.response;

public record RuntimeModuleAccessResponse(
        boolean billing,
        boolean notifications,
        boolean compliance,
        boolean incidents,
        boolean reports,
        boolean dispatch,
        boolean routes,
        boolean recurringRides,
        boolean driverPortal,
        boolean riderGuardianPortal,
        boolean organizationPortal) {
}