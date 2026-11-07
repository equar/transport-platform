package com.transportplatform.tms.features.driver.application;

import org.springframework.core.io.Resource;

public record StoredDriverDocumentFile(Resource resource, String fileName, String contentType) {
}
