package com.transportplatform.tms.features.driver.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.privacy.PhiCipher;
import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.*;

class DocumentProtectionTest {
    @TempDir Path root;
    final byte[] content="%PDF-1.4\nSynthetic document".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    PhiCipher cipher() {
        String key=Base64.getEncoder().encodeToString(new byte[32]);byte[] other=new byte[32];other[0]=1;
        return new PhiCipher("test:"+key,"test",Base64.getEncoder().encodeToString(other),false);
    }
    DriverDocumentStorageService storage(DocumentScanner scanner,int files) {return new DriverDocumentStorageService(root.toString(),cipher(),scanner,10485760,files);}
    MockMultipartFile file() {return new MockMultipartFile("file","test.pdf","application/pdf",content);}
    @Test void rollbackRemovesEncryptedUploadsAndQuotasRejectFurtherWrites() throws Exception {
        var storage=storage(mock(DocumentScanner.class),1);
        TransactionSynchronizationManager.initSynchronization();
        try {
            String path=storage.store("tenant",1L,file());
            assertTrue(Files.readString(root.resolve(path)).startsWith("phi1."));
            assertThrows(ApiException.class,()->storage.store("tenant",1L,file()));
            for(var callback:TransactionSynchronizationManager.getSynchronizations()) callback.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
            assertFalse(Files.exists(root.resolve(path)));
        } finally {TransactionSynchronizationManager.clearSynchronization();}
    }
    @Test void offlineMigrationProtectsLegacyFilesAndOwnerBindingPreventsRelocation() throws Exception {
        Path path=root.resolve("tenant/1/test.pdf");Files.createDirectories(path.getParent());Files.write(path,content);
        var scanner=mock(DocumentScanner.class);
        DocumentFileProtection.protectExisting(root,cipher(),scanner);
        assertTrue(Files.readString(path).startsWith("phi1."));
        assertArrayEquals(content,DocumentFileProtection.read(path,"tenant",1,cipher()));
        assertThrows(IllegalStateException.class,()->DocumentFileProtection.read(path,"other",1,cipher()));
        verify(scanner).requireClean(content);
    }
    @Test void rejectedScansNeverWriteAFile() throws Exception {
        var scanner=mock(DocumentScanner.class);doThrow(new ApiException(ErrorCode.VALIDATION_FAILED,org.springframework.http.HttpStatus.BAD_REQUEST,"rejected")).when(scanner).requireClean(any());
        assertThrows(ApiException.class,()->storage(scanner,10).store("tenant",1L,file()));
        try(var files=Files.walk(root)){assertEquals(1,files.count());}
    }
    @Test void clamdUsesBoundedStreamProtocolAndFailsClosed() throws Exception {
        for(String reply:List.of("stream: OK", "stream: Eicar-Signature FOUND", "stream: ERROR")) {
            try(var server=new ServerSocket(0,1,InetAddress.getLoopbackAddress());var pool=Executors.newSingleThreadExecutor()) {
                var sent=pool.submit(()->{
                    try(var socket=server.accept()) {
                        var input=new DataInputStream(socket.getInputStream());var command=new ByteArrayOutputStream();int c;
                        while((c=input.read())>0)command.write(c);
                        assertEquals("zINSTREAM",command.toString());
                        var body=new ByteArrayOutputStream();int count;
                        while((count=input.readInt())>0)body.write(input.readNBytes(count));
                        assertArrayEquals(content,body.toByteArray());
                        socket.getOutputStream().write((reply+"\0").getBytes(java.nio.charset.StandardCharsets.US_ASCII));
                    }
                    return true;
                });
                var scanner=new DocumentScanner(true,server.getInetAddress().getHostAddress(),server.getLocalPort(),new MockEnvironment());
                if(reply.equals("stream: OK"))scanner.requireClean(content);
                else assertThrows(ApiException.class,()->scanner.requireClean(content));
                assertTrue(sent.get(3,TimeUnit.SECONDS));
            }
        }
    }
    @Test void productionCannotDisableSecurityScanning() {
        var environment=new MockEnvironment();environment.setActiveProfiles("prod");
        assertThrows(IllegalStateException.class,()->new DocumentScanner(false,"127.0.0.1",3310,environment));
    }
}
