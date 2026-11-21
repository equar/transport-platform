package com.transportplatform.tms.features.driver.application;
import com.transportplatform.tms.common.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import static org.junit.jupiter.api.Assertions.*;
class DriverDocumentIsolationTest {
    @TempDir Path root;
    private DriverDocumentStorageService storage() {
        String key=java.util.Base64.getEncoder().encodeToString(new byte[32]);
        byte[] independent=new byte[32];independent[0]=1;
        var cipher=new com.transportplatform.tms.common.privacy.PhiCipher("test:"+key,"test",java.util.Base64.getEncoder().encodeToString(independent),true);
        return new DriverDocumentStorageService(root.toString(),cipher,org.mockito.Mockito.mock(DocumentScanner.class),1073741824L,10000);
    }
    @Test void validPdfCanBeStoredAndReadWithinItsDriverScope() throws Exception {
        byte[] bytes = "%PDF-1.4\nSynthetic upload check".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        var file = new org.springframework.mock.web.MockMultipartFile("file", "test.pdf", "application/pdf", bytes);
        var storage = storage();
        String path = storage.store("tenant-a", 10L, file);
        assertTrue(path.startsWith("tenant-a/10/"));
        assertTrue(Files.readString(root.resolve(path)).startsWith("phi1."));
        assertArrayEquals(bytes, storage.load("tenant-a", 10L, path, "test.pdf", "application/pdf").resource().getInputStream().readAllBytes());
    }
    @Test void cannotReadAnotherTenantsFileOrTraverseAwayFromOwner() throws Exception {
        Path file = root.resolve("tenant-b/4/private.pdf"); Files.createDirectories(file.getParent()); Files.writeString(file, "%PDF-private");
        var storage = storage();
        assertThrows(ApiException.class, () -> storage.load("tenant-a", 4L, "tenant-b/4/private.pdf", "private.pdf", "application/pdf"));
        assertThrows(ApiException.class, () -> storage.load("tenant-a", 4L, "tenant-a/4/../../tenant-b/4/private.pdf", "private.pdf", "application/pdf"));
        assertNotNull(storage.load("tenant-b", 4L, "tenant-b/4/private.pdf", "private.pdf", "application/pdf"));
    }
    @Test void symlinkCannotEscapeTheOwnersDirectory() throws Exception {
        Path victim = root.resolve("tenant-b/4/private.pdf"); Files.createDirectories(victim.getParent()); Files.writeString(victim, "%PDF-private");
        Path link = root.resolve("tenant-a/4/private.pdf"); Files.createDirectories(link.getParent()); Files.createSymbolicLink(link, victim);
        assertThrows(ApiException.class, () -> storage().load("tenant-a", 4L, "tenant-a/4/private.pdf", "private.pdf", "application/pdf"));
    }
}
