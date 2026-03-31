package com.transportplatform.tms.features.user.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import org.springframework.http.HttpStatus;

public final class UserStatusWorkflow {

    private UserStatusWorkflow() {
    }

    public static void ensureCanActivate(UserStatus currentStatus) {
        if (currentStatus == UserStatus.ACTIVE) {
            throw invalidTransition("User is already active.");
        }
    }

    public static void ensureCanSuspend(UserStatus currentStatus) {
        if (currentStatus != UserStatus.ACTIVE && currentStatus != UserStatus.INVITED) {
            throw invalidTransition("Only active or pending users can be suspended.");
        }
    }

    public static void ensureCanDeactivate(UserStatus currentStatus) {
        if (currentStatus == UserStatus.DEACTIVATED) {
            throw invalidTransition("User is already deactivated.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(
                ErrorCode.INVALID_STATUS_TRANSITION,
                HttpStatus.BAD_REQUEST,
                message);
    }
}