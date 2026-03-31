package com.transportplatform.tms.common.response;

public record ApiResponse<T>(
        boolean success,
        T data,
        ApiErrorResponse error
) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> failure(ApiErrorResponse error) {
        return new ApiResponse<>(false, null, error);
    }
}
