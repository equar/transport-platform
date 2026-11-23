package com.transportplatform.tms.common.exception;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.transportplatform.tms.common.response.ApiErrorResponse;
import com.transportplatform.tms.common.response.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException exception) {
        ApiErrorResponse error = ApiErrorResponse.of(
                exception.getErrorCode().name(),
                exception.getMessage(),
                exception.getDetails());
        var response = ResponseEntity.status(exception.getStatus());
        if (exception.getStatus().value() == 429 && exception.getDetails() != null
                && exception.getDetails().get("retryAfterSeconds") instanceof Number retry)
            response.header("Retry-After", Long.toString(Math.max(1, retry.longValue())));
        return response.body(ApiResponse.failure(error));
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
                "Some submitted fields are missing or invalid. Review the field details and try again.",
                details);
        return ResponseEntity.badRequest().body(ApiResponse.failure(error));
    }

    @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnsupportedMediaType(
            org.springframework.web.HttpMediaTypeNotSupportedException exception) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(ApiResponse.failure(
                ApiErrorResponse.of(ErrorCode.VALIDATION_FAILED.name(),
                        "The request format is not supported. Refresh the page and try again.", Map.of())));
    }

    @ExceptionHandler(org.springframework.web.bind.MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParameter(
            org.springframework.web.bind.MissingServletRequestParameterException exception) {
        return ResponseEntity.badRequest().body(ApiResponse.failure(ApiErrorResponse.of(
                ErrorCode.VALIDATION_FAILED.name(), "A required field is missing: " + exception.getParameterName() + ".",
                Map.of("field", exception.getParameterName()))));
    }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidParameter(
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException exception) {
        return ResponseEntity.badRequest().body(ApiResponse.failure(ApiErrorResponse.of(
                ErrorCode.VALIDATION_FAILED.name(), "The field contains an invalid value: " + exception.getName() + ".",
                Map.of("field", exception.getName()))));
    }

    @ExceptionHandler(org.springframework.web.multipart.support.MissingServletRequestPartException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingPart(
            org.springframework.web.multipart.support.MissingServletRequestPartException exception) {
        return ResponseEntity.badRequest().body(ApiResponse.failure(ApiErrorResponse.of(
                ErrorCode.VALIDATION_FAILED.name(), "A required upload field is missing.", Map.of())));
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleUploadTooLarge(
            org.springframework.web.multipart.MaxUploadSizeExceededException exception) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(ApiResponse.failure(
                ApiErrorResponse.of(ErrorCode.VALIDATION_FAILED.name(),
                        "Document files must be 10 MB or smaller.", Map.of())));
    }

    @ExceptionHandler({jakarta.validation.ConstraintViolationException.class,
            org.springframework.web.method.annotation.HandlerMethodValidationException.class})
    public ResponseEntity<ApiResponse<Void>> handleParameterValidation(Exception exception) {
        return ResponseEntity.badRequest().body(ApiResponse.failure(ApiErrorResponse.of(
                ErrorCode.VALIDATION_FAILED.name(), "Some submitted fields are missing or invalid. Review the values and try again.", Map.of())));
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

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException exception,
                        HttpServletRequest request) {
                ApiErrorResponse error = ApiErrorResponse.of(
                                ErrorCode.FORBIDDEN.name(),
                                "Access is denied.",
                                Map.of("path", request.getRequestURI()));
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure(error));
        }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<Void>> handleOptimisticConflict(OptimisticLockingFailureException exception) {
        ApiErrorResponse error = ApiErrorResponse.of(
                ErrorCode.RESOURCE_CONFLICT.name(),
                "This record changed while your request was being processed. Refresh and try again.",
                Map.of());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.failure(error));
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(Exception exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure(
                ApiErrorResponse.of(ErrorCode.RESOURCE_NOT_FOUND.name(), "This resource was not found.", Map.of())));
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethod(Exception exception) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(ApiResponse.failure(
                ApiErrorResponse.of(ErrorCode.VALIDATION_FAILED.name(), "This action is not supported for this resource.", Map.of())));
    }

    @ExceptionHandler(org.springframework.dao.PessimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusyRecord(Exception exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.failure(
                ApiErrorResponse.of(ErrorCode.RESOURCE_CONFLICT.name(),
                        "This record is being updated. Wait a moment, refresh it, and try again.", Map.of())));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataConflict(Exception exception) {
        Throwable cause = exception;
        while (cause.getCause() != null && cause.getCause() != cause) cause = cause.getCause();
        int vendorCode = cause instanceof java.sql.SQLException sql ? sql.getErrorCode() : 0;
        String message = switch (vendorCode) {
            case 1062 -> "A record with this reference already exists. Check the existing record or use a different reference.";
            case 1451 -> "This record is still used by other records. Remove those links before deleting it.";
            case 1452 -> "A linked record is no longer available. Refresh and choose an existing record.";
            case 1264, 1406 -> "A submitted value is too large. Review the field limits and try again.";
            default -> "This change conflicts with existing data. Check the linked records and references before trying again.";
        };
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.failure(
                ApiErrorResponse.of(ErrorCode.RESOURCE_CONFLICT.name(), message, Map.of())));
    }

    @ExceptionHandler(org.springframework.web.bind.MissingRequestHeaderException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingHeader(org.springframework.web.bind.MissingRequestHeaderException exception) {
        String name = exception.getHeaderName();
        boolean stale = name.equalsIgnoreCase("If-Match") || name.equalsIgnoreCase("X-Expected-Ride-Status");
        String message = name.equalsIgnoreCase("Idempotency-Key")
                ? "The submission key is missing. Reopen this form and submit it again."
                : stale ? "Refresh this record before saving changes."
                : "A required request header is missing: " + name + ".";
        return ResponseEntity.status(stale ? HttpStatus.PRECONDITION_REQUIRED : HttpStatus.BAD_REQUEST)
                .body(ApiResponse.failure(ApiErrorResponse.of(ErrorCode.VALIDATION_FAILED.name(), message,
                        Map.of("header", name))));
    }

    @ExceptionHandler({org.springframework.dao.DataAccessResourceFailureException.class,
            org.springframework.transaction.CannotCreateTransactionException.class,
            org.springframework.jdbc.CannotGetJdbcConnectionException.class,
            org.springframework.dao.QueryTimeoutException.class,
            org.springframework.dao.TransientDataAccessResourceException.class})
    public ResponseEntity<ApiResponse<Void>> handleServiceUnavailable(Exception exception) {
        LOGGER.error("Database service unavailable; request could not complete", exception);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).header("Retry-After", "30")
                .body(ApiResponse.failure(ApiErrorResponse.of("SERVICE_UNAVAILABLE",
                        "The service is temporarily unavailable. If you were saving, check the record before submitting again.", Map.of())));
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
