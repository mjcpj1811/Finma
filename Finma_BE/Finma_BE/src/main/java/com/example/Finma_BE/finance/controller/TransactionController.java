package com.example.Finma_BE.finance.controller;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.enums.TransactionType;
import com.example.Finma_BE.finance.dto.request.CreateTransactionRequest;
import com.example.Finma_BE.finance.dto.request.UpdateTransactionRequest;
import com.example.Finma_BE.finance.dto.response.TransactionDetailResponse;
import com.example.Finma_BE.finance.dto.response.TransactionListItemResponse;
import com.example.Finma_BE.finance.service.AuthContext;
import com.example.Finma_BE.finance.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final AuthContext authContext;
    private final TransactionService transactionService;

    @PostMapping
    public ApiResponse<TransactionListItemResponse> create(@Valid @RequestBody CreateTransactionRequest request) {
        var user = authContext.requireCurrentUser();
        var created = transactionService.create(user, request);
        return ApiResponse.<TransactionListItemResponse>builder()
                .message("OK")
                .result(created)
                .build();
    }

    @GetMapping
    public ApiResponse<List<TransactionListItemResponse>> list(
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        var user = authContext.requireCurrentUser();
        var items = transactionService.list(user, type, categoryId, accountId, q, from, to);
        return ApiResponse.<List<TransactionListItemResponse>>builder()
                .message("OK")
                .result(items)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<TransactionDetailResponse> getById(@PathVariable Long id) {
        var user = authContext.requireCurrentUser();
        var detail = transactionService.getById(user, id);
        return ApiResponse.<TransactionDetailResponse>builder()
                .message("OK")
                .result(detail)
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<TransactionDetailResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTransactionRequest request
    ) {
        var user = authContext.requireCurrentUser();
        var updated = transactionService.update(user, id, request);
        return ApiResponse.<TransactionDetailResponse>builder()
                .message("OK")
                .result(updated)
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        var user = authContext.requireCurrentUser();
        transactionService.delete(user, id);
        return ApiResponse.<Void>builder()
                .message("OK")
                .build();
    }
}
