package com.transportplatform.tms.features.auth.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.auth.api.request.ChangePasswordRequest;
import com.transportplatform.tms.features.auth.api.request.ForgotPasswordRequest;
import com.transportplatform.tms.features.auth.api.request.LoginRequest;
import com.transportplatform.tms.features.auth.api.request.RefreshTokenRequest;
import com.transportplatform.tms.features.auth.api.request.ResetPasswordRequest;
import com.transportplatform.tms.features.auth.api.response.AuthTokensResponse;
import com.transportplatform.tms.features.auth.application.AuthFacade;
import com.transportplatform.tms.common.security.SecurityProperties;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import jakarta.validation.Valid;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    private static final String REFRESH_COOKIE = "tp_refresh";

    private final AuthFacade authFacade;
    private final SecurityProperties securityProperties;

    public AuthController(AuthFacade authFacade, SecurityProperties securityProperties) {
        this.authFacade = authFacade;
        this.securityProperties = securityProperties;
    }

    @PostMapping("/login")
    public ApiResponse<AuthTokensResponse> login(@Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest, HttpServletResponse response) {
        String clientType = clientType(httpRequest);
        validateWebOrigin(httpRequest, clientType);
        AuthTokensResponse result = authFacade.login(request, clientType);
        setWebRefreshCookie(httpRequest, response, clientType, result);
        return ApiResponse.success(publicResponse(clientType, result));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthTokensResponse> refresh(@RequestBody(required = false) RefreshTokenRequest request,
            HttpServletRequest httpRequest, HttpServletResponse response) {
        String clientType = clientType(httpRequest);
        validateWebOrigin(httpRequest, clientType);
        String token = "MOBILE".equals(clientType)
                ? request == null ? null : request.refreshToken()
                : cookieValue(httpRequest, REFRESH_COOKIE);
        AuthTokensResponse result = authFacade.refresh(token, clientType);
        setWebRefreshCookie(httpRequest, response, clientType, result);
        return ApiResponse.success(publicResponse(clientType, result));
    }

    @PostMapping("/logout")
    public ApiResponse<String> logout(@RequestBody(required = false) RefreshTokenRequest request,
            HttpServletRequest httpRequest, HttpServletResponse response) {
        String clientType = clientType(httpRequest);
        validateWebOrigin(httpRequest, clientType);
        String token = "MOBILE".equals(clientType)
                ? request == null ? null : request.refreshToken()
                : cookieValue(httpRequest, REFRESH_COOKIE);
        authFacade.logout(token);
        clearRefreshCookie(httpRequest, response);
        return ApiResponse.success("Signed out successfully.");
    }

    @PostMapping("/change-password")
    public ApiResponse<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return ApiResponse.success(authFacade.changePassword(request));
    }

    @PostMapping("/forgot-password")
    public ApiResponse<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ApiResponse.success(authFacade.requestPasswordReset(request));
    }

    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ApiResponse.success(authFacade.resetPassword(request));
    }

    @GetMapping("/status")
    public ApiResponse<String> status() {
        return ApiResponse.success("Auth foundation is available.");
    }

    private String clientType(HttpServletRequest request) {
        return "mobile".equalsIgnoreCase(request.getHeader("X-Client-Platform")) ? "MOBILE" : "WEB";
    }

    private void validateWebOrigin(HttpServletRequest request, String clientType) {
        if (!"WEB".equals(clientType)) return;
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank() && !securityProperties.getAllowedOrigins().contains(origin)) {
            throw new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "The request origin is not permitted.");
        }
    }

    private String cookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) if (name.equals(cookie.getName())) return cookie.getValue();
        return null;
    }

    private void setWebRefreshCookie(HttpServletRequest request, HttpServletResponse response, String clientType,
            AuthTokensResponse result) {
        if (!"WEB".equals(clientType)) return;
        String token = result.refreshToken();
        if (token != null) addCookie(request, response, token, Duration.ofDays(7));
    }

    private AuthTokensResponse publicResponse(String clientType, AuthTokensResponse result) {
        if ("MOBILE".equals(clientType)) return result;
        return new AuthTokensResponse(result.accessToken(), null, result.tokenType(), result.expiresInSeconds(),
                result.user());
    }

    private void clearRefreshCookie(HttpServletRequest request, HttpServletResponse response) {
        addCookie(request, response, "", Duration.ZERO);
    }

    private void addCookie(HttpServletRequest request, HttpServletResponse response, String token, Duration maxAge) {
        boolean secure = securityProperties.getRefreshCookie().getSecure() == null
                ? request.isSecure()
                : securityProperties.getRefreshCookie().getSecure();
        String sameSite = securityProperties.getRefreshCookie().getSameSite();
        if (sameSite == null || sameSite.isBlank()) {
            sameSite = "Lax";
        }
        if ("None".equalsIgnoreCase(sameSite) && !secure) {
            sameSite = "Lax";
        }

        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path(securityProperties.getRefreshCookie().getPath())
                .maxAge(maxAge).build().toString());
    }
}
