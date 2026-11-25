package com.transportplatform.tms.features.vehicle.application;

import com.transportplatform.tms.features.driver.application.*;
import com.transportplatform.tms.common.privacy.PhiCipher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/** Separate owner namespace; shares signature checks, encryption, scanning and rollback cleanup. */
@Service
public class VehicleDocumentStorageService {
    private final DriverDocumentStorageService delegate;
    public VehicleDocumentStorageService(@Value("${app.vehicle-document-storage.root:./var/vehicle-documents}") String root,
            PhiCipher cipher, DocumentScanner scanner,
            @Value("${app.driver-document-storage.max-tenant-bytes:1073741824}") long bytes,
            @Value("${app.driver-document-storage.max-tenant-files:10000}") int files) {
        delegate = new DriverDocumentStorageService(root, cipher, scanner, bytes, files);
    }
    public boolean present(String tenant, Long vehicle, String path) { return delegate.present(tenant, vehicle, path); }
    public String store(String tenant, Long vehicle, MultipartFile file) { return delegate.store(tenant, vehicle, file); }
    public StoredDriverDocumentFile load(String tenant, Long vehicle, String path, String name, String type) {
        return delegate.load(tenant, vehicle, path, name, type);
    }
}
