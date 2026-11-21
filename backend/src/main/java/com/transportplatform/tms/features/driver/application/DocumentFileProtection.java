package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.common.privacy.PhiCipher;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.io.IOException;

/** Owner-bound authenticated encryption, also used by offline release maintenance. */
public final class DocumentFileProtection {
    private DocumentFileProtection() {}
    public static String context(String tenant, long driver) { return "document|"+tenant+"|"+driver; }
    public static void write(Path path, byte[] bytes, String tenant, long driver, PhiCipher cipher) throws IOException {
        String sealed = cipher.encrypt(Base64.getEncoder().encodeToString(bytes), context(tenant,driver));
        Path temporary = Files.createTempFile(path.getParent(), ".protect-", ".tmp");
        try {
            Files.writeString(temporary,sealed,StandardCharsets.US_ASCII);
            Files.move(temporary,path,StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);
        } finally { Files.deleteIfExists(temporary); }
    }
    public static byte[] read(Path path, String tenant, long driver, PhiCipher cipher) throws IOException {
        if (Files.size(path)>20L*1024*1024) throw new IOException("Stored document exceeds its size limit.");
        byte[] bytes=Files.readAllBytes(path);
        if (!encrypted(path)) {
            if (cipher.legacyAllowed()) return bytes;
            throw new IOException("Run offline document protection before serving legacy files.");
        }
        return Base64.getDecoder().decode(cipher.decrypt(new String(bytes,StandardCharsets.US_ASCII),context(tenant,driver)));
    }
    public static boolean encrypted(Path path) throws IOException {
        try(var in=Files.newInputStream(path)) { return new String(in.readNBytes(5),StandardCharsets.US_ASCII).equals("phi1."); }
    }
    public static void protectExisting(Path root, PhiCipher cipher, DocumentScanner scanner) throws IOException {
        if (!Files.exists(root)) return;
        Path realRoot=root.toRealPath();
        try(var paths=Files.walk(root)) {
            for(var iterator=paths.iterator();iterator.hasNext();) {
                Path path=iterator.next();
                if (Files.isSymbolicLink(path)) throw new IOException("Symlinks are forbidden in document storage.");
                if (!Files.isRegularFile(path)) continue;
                Path relative=root.relativize(path);
                if (relative.getFileName().toString().startsWith(".protect-")) { Files.delete(path); continue; }
                if (relative.getNameCount()!=3 || !relative.getName(0).toString().matches("[A-Za-z0-9_-]{1,36}") || !path.toRealPath().startsWith(realRoot))
                    throw new IOException("Unexpected document storage layout.");
                long driver=Long.parseLong(relative.getName(1).toString());
                if (encrypted(path)) {
                    byte[] plain=read(path,relative.getName(0).toString(),driver,cipher);
                    if (!cipher.current(Files.readString(path,StandardCharsets.US_ASCII)))
                        write(path,plain,relative.getName(0).toString(),driver,cipher);
                    continue;
                }
                if (Files.size(path)>10L*1024*1024) throw new IOException("Legacy document exceeds size limit.");
                byte[] bytes=Files.readAllBytes(path); scanner.requireClean(bytes);
                write(path,bytes,relative.getName(0).toString(),driver,cipher);
            }
        }
    }
}
