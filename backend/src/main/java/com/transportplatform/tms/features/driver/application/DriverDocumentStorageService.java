package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;
import java.io.InputStream;
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
        String extension = detectedExtension(file);
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
        String detected = detectedExtension(file);
        String declared = file.getContentType();
        boolean matches = (".pdf".equals(detected) && "application/pdf".equals(declared))
                || (".jpg".equals(detected) && "image/jpeg".equals(declared))
                || (".png".equals(detected) && "image/png".equals(declared));
        if (!matches) throw invalidFile("The uploaded file type does not match its declared content type.");
    }

    private String detectedExtension(MultipartFile file) {
        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(8);
            if (header.length >= 4 && header[0] == 0x25 && header[1] == 0x50
                    && header[2] == 0x44 && header[3] == 0x46) return ".pdf";
            if (header.length >= 3 && (header[0] & 0xff) == 0xff && (header[1] & 0xff) == 0xd8
                    && (header[2] & 0xff) == 0xff) return ".jpg";
            if (header.length >= 8 && (header[0] & 0xff) == 0x89 && header[1] == 0x50
                    && header[2] == 0x4e && header[3] == 0x47 && header[4] == 0x0d
                    && header[5] == 0x0a && header[6] == 0x1a && header[7] == 0x0a) return ".png";
            throw invalidFile("The uploaded file content does not match a supported document type.");
        } catch (IOException exception) {
            throw invalidFile("The uploaded document could not be inspected.");
        }
    }

    private String safeOriginalName(String name) {
        String safe = name == null ? "document" : Path.of(name).getFileName().toString().trim();
        return safe.isEmpty() ? "document" : safe.substring(0, Math.min(safe.length(), 255));
    }

    private ApiException invalidFile(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }
}
