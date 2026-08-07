package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DriverDocumentStorageService {

    private static final long MAX_FILE_SIZE = 10L * 1024L * 1024L;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/png");

    private final Path root;

    public DriverDocumentStorageService(
            @Value("${app.driver-document-storage.root:./var/driver-documents}") String root) {
        this.root = Path.of(root).toAbsolutePath().normalize();
    }

    public String store(String tenantId, Long driverId, MultipartFile file) {
        validate(file);
        String originalName = safeOriginalName(file.getOriginalFilename());
        String extension = extensionOf(originalName);
        String relativePath = tenantId + "/" + driverId + "/" + UUID.randomUUID() + extension;
        Path destination = root.resolve(relativePath).normalize();
        if (!destination.startsWith(root)) {
            throw invalidFile("Invalid document path.");
        }
        try {
            Files.createDirectories(destination.getParent());
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            return relativePath;
        } catch (IOException exception) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR,
                    "The document could not be stored.");
        }
    }

    public StoredDriverDocumentFile load(String storagePath, String originalName, String contentType) {
        if (storagePath == null || storagePath.isBlank()) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                    "No uploaded file is attached to this document.");
        }
        Path path = root.resolve(storagePath).normalize();
        if (!path.startsWith(root) || !Files.isRegularFile(path)) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                    "The uploaded document file was not found.");
        }
        try {
            Resource resource = new UrlResource(path.toUri());
            return new StoredDriverDocumentFile(resource, safeOriginalName(originalName), contentType);
        } catch (IOException exception) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR,
                    "The document could not be read.");
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw invalidFile("A document file is required.");
        if (file.getSize() > MAX_FILE_SIZE) throw invalidFile("Document files must be 10 MB or smaller.");
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw invalidFile("Only PDF, JPEG, and PNG documents are supported.");
        }
    }

    private String safeOriginalName(String name) {
        String safe = name == null ? "document" : Path.of(name).getFileName().toString().trim();
        return safe.isEmpty() ? "document" : safe.substring(0, Math.min(safe.length(), 255));
    }

    private String extensionOf(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot).toLowerCase();
    }

    private ApiException invalidFile(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }
}
