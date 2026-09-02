package com.transportplatform.tms.common.exception;

import com.transportplatform.tms.common.response.ApiErrorResponse;
import com.transportplatform.tms.common.response.ApiResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.dao.OptimisticLockingFailureException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException exception) {
        ApiErrorResponse error = ApiErrorResponse.of(
                exception.getErrorCode().name(),
                exception.getMessage(),
                exception.getDetails());
        return ResponseEntity.status(exception.getStatus()).body(ApiResponse.failure(error));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put(
                "fieldErrors",
                exception.getBindingResult().getFieldErrors().stream()
                        .collect(Collectors.toMap(
                                FieldError::getField,
                                fieldError -> fieldError.getDefaultMessage() == null ? "Invalid value"
                                        : fieldError.getDefaultMessage(),
                                (left, right) -> right,
                                LinkedHashMap::new)));
        ApiErrorResponse error = ApiErrorResponse.of(
                ErrorCode.VALIDATION_FAILED.name(),
                "Validation failed for the request.",
                details);
        return ResponseEntity.badRequest().body(ApiResponse.failure(error));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnreadableRequest(HttpMessageNotReadableException exception) {
        LOGGER.debug("Request body could not be parsed", exception);
        ApiErrorResponse error = ApiErrorResponse.of(
                ErrorCode.VALIDATION_FAILED.name(),
                "The request contains an invalid or unsupported value.",
                Map.of());
        return ResponseEntity.badRequest().body(ApiResponse.failure(error));
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<Void>> handleOptimisticConflict(OptimisticLockingFailureException exception) {
        ApiErrorResponse error = ApiErrorResponse.of(
                ErrorCode.RESOURCE_CONFLICT.name(),
                "This record changed while your request was being processed. Refresh and try again.",
                Map.of());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.failure(error));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnhandled(Exception exception) {
        LOGGER.error("Unhandled exception", exception);
        ApiErrorResponse error = ApiErrorResponse.of(
                ErrorCode.INTERNAL_SERVER_ERROR.name(),
                "An unexpected error occurred.",
                Map.of());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.failure(error));
    }
}
