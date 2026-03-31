package com.example.Finma_BE.controller.recurringTransaction;


import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionCreateRequest;
import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionToggleRequest;
import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionUpdateRequest;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionResponse;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionStatsResponse;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionSummaryResponse;
import com.example.Finma_BE.enums.RecurringStatus;
import com.example.Finma_BE.repository.RecurringTransactionRepository;
import com.example.Finma_BE.service.RecurringTransactionService.RecurringTransactionService;
import com.example.Finma_BE.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/recurring-transaction")
public class RecurringTransactionController {

    RecurringTransactionService recurringTransactionService;

    @GetMapping("/stats")
    ApiResponse<RecurringTransactionStatsResponse> getStats() {
        return ApiResponse.<RecurringTransactionStatsResponse>builder()
                .result(recurringTransactionService.getStats(SecurityUtils.getCurrentUserId()))
                .build();
    }

    @GetMapping
    ApiResponse<List<RecurringTransactionSummaryResponse>> getAll(
            @RequestParam(required = false) RecurringStatus status) {
        return ApiResponse.<List<RecurringTransactionSummaryResponse>>builder()
                .result(recurringTransactionService.getAll(SecurityUtils.getCurrentUserId(), status))
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<RecurringTransactionResponse> getById(@PathVariable Long id) {
        return ApiResponse.<RecurringTransactionResponse>builder()
                .result(recurringTransactionService.getById(id, SecurityUtils.getCurrentUserId()))
                .build();
    }

    @PostMapping
    ApiResponse<RecurringTransactionResponse> create(
            @Valid @RequestBody RecurringTransactionCreateRequest request) {
        return ApiResponse.<RecurringTransactionResponse>builder()
                .result(recurringTransactionService.create(SecurityUtils.getCurrentUserId(), request))
                .build();
    }

    @PutMapping("/{id}")
    ApiResponse<RecurringTransactionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody RecurringTransactionUpdateRequest request) {
        return ApiResponse.<RecurringTransactionResponse>builder()
                .result(recurringTransactionService.update(id, SecurityUtils.getCurrentUserId(), request))
                .build();
    }

    @PatchMapping("/{id}/toggle")
    ApiResponse<RecurringTransactionResponse> toggle(
            @PathVariable Long id,
            @Valid @RequestBody RecurringTransactionToggleRequest request) {
        return ApiResponse.<RecurringTransactionResponse>builder()
                .result(recurringTransactionService.toggle(id, SecurityUtils.getCurrentUserId(), request))
                .build();
    }

    @DeleteMapping("/{id}")
    ApiResponse<Void> delete(@PathVariable Long id) {
            recurringTransactionService.delete(id, SecurityUtils.getCurrentUserId());
        return ApiResponse.<Void>builder().build();
    }
}
