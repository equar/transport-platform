package com.transportplatform.tms.features.driver.application;
import com.transportplatform.tms.common.exception.*;
import java.security.MessageDigest;
import java.util.*;
import org.springframework.http.HttpStatus;
public final class DocumentReviewEvidence {
    private DocumentReviewEvidence() {}
    public static String hash(StoredDriverDocumentFile file) {
        if(!Set.of("application/pdf","image/jpeg","image/png").contains(file.contentType()))
            throw new ApiException(ErrorCode.VALIDATION_FAILED,HttpStatus.BAD_REQUEST,"Upload a supported PDF, JPEG or PNG before verification.");
        try(var input=file.resource().getInputStream()) {
            byte[] bytes=input.readNBytes(10*1024*1024+1);
            if(bytes.length==0 || bytes.length>10*1024*1024) throw new java.io.IOException("Invalid evidence size");
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch(Exception error) {
            throw new ApiException(ErrorCode.SERVICE_UNAVAILABLE,HttpStatus.SERVICE_UNAVAILABLE,"Document evidence could not be read. Restore or upload the file before reviewing it.");
        }
    }
}
