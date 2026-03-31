package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.organization.domain.Contract;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;

public final class ContractStatusWorkflow {

    private ContractStatusWorkflow() {
    }

    public static void ensureCanActivate(Contract contract, LocalDate today) {
        ContractStatus currentStatus = resolveEffectiveStatus(contract, today);
        if (currentStatus != ContractStatus.DRAFT
                && currentStatus != ContractStatus.SUSPENDED
                && currentStatus != ContractStatus.INACTIVE) {
            throw invalidTransition("Only draft, suspended, or inactive contracts can be activated.");
        }
        if (contract.getEndDate() != null && contract.getEndDate().isBefore(today)) {
            throw invalidTransition("A contract with a past end date cannot be activated.");
        }
    }

    public static void ensureCanSuspend(Contract contract, LocalDate today) {
        if (resolveEffectiveStatus(contract, today) != ContractStatus.ACTIVE) {
            throw invalidTransition("Only active contracts can be suspended.");
        }
    }

    public static void ensureCanTerminate(Contract contract, LocalDate today) {
        ContractStatus currentStatus = resolveEffectiveStatus(contract, today);
        if (currentStatus == ContractStatus.TERMINATED || currentStatus == ContractStatus.INACTIVE) {
            throw invalidTransition("Only active, suspended, draft, or expired contracts can be terminated.");
        }
    }

    public static void ensureCanDeactivate(ContractStatus currentStatus) {
        if (currentStatus == ContractStatus.INACTIVE) {
            throw invalidTransition("Contract is already inactive.");
        }
    }

    public static ContractStatus resolveEffectiveStatus(Contract contract, LocalDate today) {
        if ((contract.getStatus() == ContractStatus.ACTIVE || contract.getStatus() == ContractStatus.SUSPENDED)
                && contract.getEndDate() != null
                && contract.getEndDate().isBefore(today)) {
            return ContractStatus.EXPIRED;
        }
        return contract.getStatus();
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}