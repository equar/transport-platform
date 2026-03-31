package com.transportplatform.tms.common.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;
    private final HttpStatus status;
    private final Map<String, Object> details;

    public ApiException(ErrorCode errorCode, HttpStatus status, String message) {
        this(errorCode, status, message, Map.of());
    }

    public ApiException(ErrorCode errorCode, HttpStatus status, String message, Map<String, Object> details) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
        this.details = details;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Map<String, Object> getDetails() {
        return details;
    }
}
