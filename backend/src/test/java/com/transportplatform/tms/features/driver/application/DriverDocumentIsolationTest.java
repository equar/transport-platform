package com.transportplatform.tms.features.driver.application;
import com.transportplatform.tms.common.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import static org.junit.jupiter.api.Assertions.*;
class DriverDocumentIsolationTest {
    @TempDir Path root;
    @Test void cannotReadAnotherTenantsFileOrTraverseAwayFromOwner() throws Exception {
        Path file = root.resolve("tenant-b/4/private.pdf"); Files.createDirectories(file.getParent()); Files.writeString(file, "%PDF-private");
        var storage = new DriverDocumentStorageService(root.toString());
        assertThrows(ApiException.class, () -> storage.load("tenant-a", 4L, "tenant-b/4/private.pdf", "private.pdf", "application/pdf"));
        assertThrows(ApiException.class, () -> storage.load("tenant-a", 4L, "tenant-a/4/../../tenant-b/4/private.pdf", "private.pdf", "application/pdf"));
        assertNotNull(storage.load("tenant-b", 4L, "tenant-b/4/private.pdf", "private.pdf", "application/pdf"));
    }
    @Test void symlinkCannotEscapeTheOwnersDirectory() throws Exception {
        Path victim = root.resolve("tenant-b/4/private.pdf"); Files.createDirectories(victim.getParent()); Files.writeString(victim, "%PDF-private");
        Path link = root.resolve("tenant-a/4/private.pdf"); Files.createDirectories(link.getParent()); Files.createSymbolicLink(link, victim);
        assertThrows(ApiException.class, () -> new DriverDocumentStorageService(root.toString()).load("tenant-a", 4L, "tenant-a/4/private.pdf", "private.pdf", "application/pdf"));
    }
}
