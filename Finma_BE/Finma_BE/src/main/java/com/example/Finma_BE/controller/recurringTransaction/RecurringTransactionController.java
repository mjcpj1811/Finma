package com.example.Finma_BE.controller.recurringTransaction;


import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionCreateRequest;
import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionToggleRequest;
import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionUpdateRequest;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionResponse;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionStatsResponse;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionSummaryResponse;
import com.example.Finma_BE.enums.RecurringStatus;
import com.example.Finma_BE.service.RecurringTransactionService.RecurringTransactionService;
import com.example.Finma_BE.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API quan ly giao dich dinh ky.
 */
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/recurring-transactions")
public class RecurringTransactionController {

    RecurringTransactionService recurringTransactionService;

        /**
         * Thong ke dinh ky.
         */
        @GetMapping("/stats")
    ApiResponse<RecurringTransactionStatsResponse> getStats() {
                Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<RecurringTransactionStatsResponse>builder()
                                .result(recurringTransactionService.getStats(userId))
                .build();
    }

        /**
         * Lay danh sach giao dich dinh ky theo trang thai neu co.
         */
        @GetMapping
    ApiResponse<List<RecurringTransactionSummaryResponse>> getAll(
            @RequestParam(required = false) RecurringStatus status) {
                Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<List<RecurringTransactionSummaryResponse>>builder()
                                .result(recurringTransactionService.getAll(userId, status))
                .build();
    }

        /**
         * Lay chi tiet giao dich dinh ky.
         */
        @GetMapping("/{id}")
    ApiResponse<RecurringTransactionResponse> getById(@PathVariable Long id) {
                Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<RecurringTransactionResponse>builder()
                                .result(recurringTransactionService.getById(id, userId))
                .build();
    }

        /**
         * Tao giao dich dinh ky.
         */
        @PostMapping
    ApiResponse<RecurringTransactionResponse> create(
            @Valid @RequestBody RecurringTransactionCreateRequest request) {
                Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<RecurringTransactionResponse>builder()
                                .result(recurringTransactionService.create(userId, request))
                .build();
    }

        /**
         * Cap nhat giao dich dinh ky.
         */
        @PutMapping("/{id}")
    ApiResponse<RecurringTransactionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody RecurringTransactionUpdateRequest request) {
                Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<RecurringTransactionResponse>builder()
                                .result(recurringTransactionService.update(id, userId, request))
                .build();
    }

        /**
         * Bat/tat giao dich dinh ky.
         */
        @PatchMapping("/{id}/toggle")
    ApiResponse<RecurringTransactionResponse> toggle(
            @PathVariable Long id,
            @Valid @RequestBody RecurringTransactionToggleRequest request) {
                Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<RecurringTransactionResponse>builder()
                                .result(recurringTransactionService.toggle(id, userId, request))
                .build();
    }

        /**
         * Huy giao dich dinh ky (khong xoa vat ly).
         */
        @DeleteMapping("/{id}")
    ApiResponse<Void> delete(@PathVariable Long id) {
                Long userId = SecurityUtils.getCurrentUserId();
                recurringTransactionService.delete(id, userId);
        return ApiResponse.<Void>builder().build();
    }
}
