package com.transportplatform.tms.features.role.api.response;

public record RoleCatalogItemResponse(
        String name,
        String displayName,
        String description,
        String scope,
        boolean assignable,
        long userCount) {
}