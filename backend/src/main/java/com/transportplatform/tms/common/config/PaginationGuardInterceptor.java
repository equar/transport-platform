package com.transportplatform.tms.common.config;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Component
@Configuration
public class PaginationGuardInterceptor implements HandlerInterceptor, WebMvcConfigurer {

    private static final int MAX_PAGE_SIZE = 200;

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler) {
        Integer page = parseIntegerParameter(request, "page", false);
        Integer size = parseIntegerParameter(request, "size", false);

        if (page != null && page < 0) {
            throw paginationValidationException("page", "Use a value greater than or equal to 0.");
        }
        if (size != null && (size < 1 || size > MAX_PAGE_SIZE)) {
            throw paginationValidationException("size",
                    "Use a value between 1 and " + MAX_PAGE_SIZE + ".");
        }
        return true;
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(this);
    }

    private Integer parseIntegerParameter(HttpServletRequest request, String parameterName, boolean required) {
        String raw = request.getParameter(parameterName);
        if (raw == null || raw.isBlank()) {
            if (required) {
                throw paginationValidationException(parameterName, "A value is required.");
            }
            return null;
        }
        try {
            return Integer.valueOf(raw.trim());
        } catch (NumberFormatException exception) {
            throw paginationValidationException(parameterName, "Use a whole number.");
        }
    }

    private ApiException paginationValidationException(String field, String message) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("fieldErrors", Map.of(field, message));
        return new ApiException(
                ErrorCode.VALIDATION_FAILED,
                HttpStatus.BAD_REQUEST,
                "Validation failed for the request.",
                details);
    }
}