package com.example.Finma_BE.controller.debt;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.request.debt.DebtPaymentCreateRequest;
import com.example.Finma_BE.dto.request.debt.DebtPaymentUpdateRequest;
import com.example.Finma_BE.dto.response.debt.DebtPaymentResponse;
import com.example.Finma_BE.service.debt.DebtPaymentService;
import com.example.Finma_BE.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/debts/{debtId}/payments")
public class DebtPaymentController {

    DebtPaymentService debtPaymentService;

    @GetMapping
    ApiResponse<List<DebtPaymentResponse>> getDebtPayments(@PathVariable Long debtId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<List<DebtPaymentResponse>>builder()
                .result(debtPaymentService.getDebtPayments(debtId, userId))
                .build();
    }

    @PostMapping
    ApiResponse<DebtPaymentResponse> createDebtPayment(@Valid @RequestBody DebtPaymentCreateRequest request
            , @PathVariable Long debtId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<DebtPaymentResponse>builder()
                .result(debtPaymentService.createPayment(debtId,userId,request))
                .build();
    }

    @PutMapping("/{debtPaymentId}")
    ApiResponse<DebtPaymentResponse> updateDebtPayment(@Valid @RequestBody DebtPaymentUpdateRequest request
            , @PathVariable Long debtPaymentId
            , @PathVariable Long debtId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<DebtPaymentResponse>builder()
                .result(debtPaymentService.updatePayment(debtId, debtPaymentId, request, userId))
                .build();
    }

    @DeleteMapping("/{debtPaymentId}")
    ApiResponse<Void> deleteDebtPayment(@PathVariable Long debtPaymentId, @PathVariable Long debtId) {
        Long userId = SecurityUtils.getCurrentUserId();
        debtPaymentService.deletePayment(debtId, debtPaymentId, userId);
        return ApiResponse.<Void>builder()
                .message("Debt payment deleted successfully")
                .build();
    }
}
