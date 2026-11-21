package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.common.exception.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/** ClamD INSTREAM; plaintext never enters a temporary file or a public network. */
@Component
public class DocumentScanner {
    private final boolean enabled;
    private final String host;
    private final int port;
    private final Semaphore slots = new Semaphore(4);
    public DocumentScanner(@Value("${app.document-scan.enabled:false}") boolean enabled,
            @Value("${app.document-scan.host:127.0.0.1}") String host,
            @Value("${app.document-scan.port:3310}") int port, Environment environment) {
        this.enabled = enabled; this.host = host; this.port = port;
    }
    public void requireClean(byte[] bytes) {
        if (!enabled) return;
        if (!slots.tryAcquire()) throw unavailable();
        try (Socket socket = new Socket()) {
            InetAddress address = InetAddress.getByName(host);
            if (!address.isLoopbackAddress()) throw new IOException("Scanner must use a loopback connection.");
            socket.connect(new InetSocketAddress(address, port), 3000);
            socket.setSoTimeout(30000);
            CompletableFuture.delayedExecutor(30, TimeUnit.SECONDS).execute(() -> { try { socket.close(); } catch (IOException ignored) {} });
            var out = new DataOutputStream(socket.getOutputStream());
            out.write("zINSTREAM\0".getBytes(StandardCharsets.US_ASCII));
            for (int offset=0; offset<bytes.length; offset+=8192) {
                int size = Math.min(8192, bytes.length-offset); out.writeInt(size); out.write(bytes,offset,size);
            }
            out.writeInt(0); out.flush();
            var reply = new ByteArrayOutputStream(); int next;
            while ((next=socket.getInputStream().read())>0) {
                if (reply.size()>=1024) throw new IOException("Scanner reply too large.");
                reply.write(next);
            }
            if (next != 0) throw new IOException("Incomplete scanner reply.");
            String result = reply.toString(StandardCharsets.US_ASCII);
            if (result.endsWith(" FOUND")) throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "This file did not pass the security check. Choose a clean document and try again.");
            if (!result.equals("stream: OK")) throw unavailable();
        } catch (IOException failure) { throw unavailable(); }
        finally { slots.release(); }
    }
    private ApiException unavailable() { return new ApiException(ErrorCode.SERVICE_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE,
            "Document security checking is temporarily unavailable. Wait a moment and upload the file again."); }
}
