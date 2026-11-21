package com.transportplatform.tms.features.driver.application;

import java.nio.file.*;
import java.time.*;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DocumentStorageCleanup {
    private final Path root;
    private final JdbcTemplate db;
    private final Clock clock;
    public DocumentStorageCleanup(@Value("${app.driver-document-storage.root:./var/driver-documents}") String root, JdbcTemplate db, Clock clock) {
        this.root=Path.of(root).toAbsolutePath().normalize(); this.db=db; this.clock=clock;
    }
    @Scheduled(fixedDelayString="${app.driver-document-storage.cleanup-delay:PT6H}")
    public void removeOrphans() throws IOException {
        if (!Files.isDirectory(root)) return;
        var cutoff=clock.instant().minus(Duration.ofHours(24));
        try(var files=Files.walk(root,3)) {
            for(var iterator=files.iterator();iterator.hasNext();) {
                Path path=iterator.next();
                if (Files.isSymbolicLink(path) || !Files.isRegularFile(path,LinkOption.NOFOLLOW_LINKS)
                        || !path.toRealPath().startsWith(root.toRealPath()) || !Files.getLastModifiedTime(path).toInstant().isBefore(cutoff)) continue;
                String name=path.getFileName().toString();
                if (!name.matches("[0-9a-fA-F-]{36}\\.(pdf|jpg|png)") && !name.startsWith(".protect-")) continue;
                String relative=root.relativize(path).toString().replace('\\','/');
                if (db.queryForObject("SELECT COUNT(*) FROM driver_documents WHERE storage_path=?",Long.class,relative)==0)
                    Files.deleteIfExists(path);
            }
        }
    }
}
