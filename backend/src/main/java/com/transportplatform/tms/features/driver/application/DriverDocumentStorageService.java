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

    private final com.transportplatform.tms.common.privacy.PhiCipher cipher;
    private final DocumentScanner scanner;
    private final long maxTenantBytes;
    private final int maxTenantFiles;
    public DriverDocumentStorageService(
            @Value("${app.driver-document-storage.root:./var/driver-documents}") String root,
            com.transportplatform.tms.common.privacy.PhiCipher cipher, DocumentScanner scanner,
            @Value("${app.driver-document-storage.max-tenant-bytes:1073741824}") long maxTenantBytes,
            @Value("${app.driver-document-storage.max-tenant-files:10000}") int maxTenantFiles) {
        this.root = Path.of(root).toAbsolutePath().normalize();
        this.cipher = cipher; this.scanner = scanner;
        if (maxTenantBytes < MAX_FILE_SIZE || maxTenantFiles < 1) throw new IllegalArgumentException("Document quotas must be positive and permit a maximum-size file.");
        this.maxTenantBytes = maxTenantBytes; this.maxTenantFiles = maxTenantFiles;
    }

    public synchronized String store(String tenantId, Long driverId, MultipartFile file) {
        if (tenantId == null || !tenantId.matches("[A-Za-z0-9_-]{1,36}") || driverId == null || driverId <= 0) throw invalidFile("Invalid document owner.");
        validate(file);
        String extension = detectedExtension(file);
        String relativePath = tenantId + "/" + driverId + "/" + UUID.randomUUID() + extension;
        Path destination = root.resolve(relativePath).normalize();
        if (!destination.startsWith(root)) {
            throw invalidFile("Invalid document path.");
        }
        try (InputStream input = file.getInputStream()) {
            byte[] bytes = input.readNBytes((int)MAX_FILE_SIZE+1);
            if (bytes.length > MAX_FILE_SIZE) throw invalidFile("Document files must be 10 MB or smaller.");
            scanner.requireClean(bytes);
            Files.createDirectories(destination.getParent());
            if (!destination.getParent().toRealPath().equals(root.toRealPath().resolve(tenantId).resolve(driverId.toString()))) throw invalidFile("Invalid document path.");
            enforceQuota(tenantId, bytes.length*2L+1024);
            DocumentFileProtection.write(destination, bytes, tenantId, driverId, cipher);
            if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
                org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override public void afterCompletion(int status) {
                            if (status == STATUS_ROLLED_BACK) try { Files.deleteIfExists(destination); }
                            catch (IOException failure) { org.slf4j.LoggerFactory.getLogger(getClass()).error("Rolled-back document cleanup failed; scheduled cleanup will retry."); }
                        }
                    });
            }
            return relativePath;
        } catch (IOException exception) {
            throw new ApiException(ErrorCode.SERVICE_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE,
                    "Document storage is temporarily unavailable. Wait a moment and upload the file again.");
        }
    }

    private void enforceQuota(String tenant, long incoming) throws IOException {
        long bytes = 0; int count = 0;
        try (var paths = Files.walk(root.resolve(tenant))) {
            for (var iterator=paths.iterator(); iterator.hasNext();) {
                var path=iterator.next();
                if (Files.isSymbolicLink(path)) throw invalidFile("Invalid document path.");
                if (Files.isRegularFile(path)) { bytes+=Files.size(path); count++; }
                if (bytes+incoming>maxTenantBytes || count>=maxTenantFiles) throw new ApiException(ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT, "Your company's document storage limit has been reached. Contact support to review retention or increase the limit.");
            }
        }
    }

    public StoredDriverDocumentFile load(String tenantId, Long driverId, String storagePath, String originalName, String contentType) {
        if (storagePath == null || storagePath.isBlank()) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                    "No uploaded file is attached to this document.");
        }
        String expectedPrefix = tenantId + "/" + driverId + "/";
        if (!storagePath.startsWith(expectedPrefix)) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, "The uploaded document file was not found.");
        }
        Path path = root.resolve(storagePath).normalize();
        Path ownerRoot = root.resolve(expectedPrefix).normalize();
        if (!path.startsWith(ownerRoot) || !path.startsWith(root) || !Files.isRegularFile(path)) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND,
                    "The uploaded document file was not found.");
        }
        try {
            Path realPath = path.toRealPath();
            if (!realPath.startsWith(root.toRealPath()) || !realPath.startsWith(root.toRealPath().resolve(expectedPrefix).normalize())) {
                throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, "The uploaded document file was not found.");
            }
            Resource resource = new org.springframework.core.io.ByteArrayResource(DocumentFileProtection.read(realPath, tenantId, driverId, cipher));
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

    public static String safeOriginalName(String name) {
        String safe = name == null ? "document" : name.replace('\\', '/');
        safe = safe.substring(safe.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "").strip();
        return safe.isEmpty() ? "document" : safe.substring(0, Math.min(safe.length(), 255));
    }

    private ApiException invalidFile(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }
}
