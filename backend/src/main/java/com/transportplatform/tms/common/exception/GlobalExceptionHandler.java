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

    @ExceptionHandler({org.springframework.dao.PessimisticLockingFailureException.class,
            org.springframework.dao.DataIntegrityViolationException.class})
    public ResponseEntity<ApiResponse<Void>> handleDataConflict(Exception exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.failure(
                ApiErrorResponse.of(ErrorCode.RESOURCE_CONFLICT.name(),
                        "This change conflicts with another update. Refresh and retry the same request.", Map.of())));
    }

    @ExceptionHandler(org.springframework.web.bind.MissingRequestHeaderException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingHeader(Exception exception) {
        return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED).body(ApiResponse.failure(
                ApiErrorResponse.of(ErrorCode.RESOURCE_CONFLICT.name(), "Refresh this record before saving changes.", Map.of())));
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
