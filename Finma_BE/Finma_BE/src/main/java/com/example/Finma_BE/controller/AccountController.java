package com.example.Finma_BE.controller;

import com.example.Finma_BE.dto.request.AccountRequest;
import com.example.Finma_BE.dto.response.AccountResponse;
import com.example.Finma_BE.dto.response.AccountSummaryResponse;
import com.example.Finma_BE.dto.response.TransactionResponse;
import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.service.AccountService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/accounts")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AccountController {
    AccountService accountService;

    @PostMapping
    ApiResponse<AccountResponse> createAccount(@RequestBody @Valid AccountRequest request) {
        return ApiResponse.<AccountResponse>builder()
                .result(accountService.createAccount(request))
                .build();
    }

    @PutMapping("/{accountId}")
    ApiResponse<AccountResponse> updateAccount(@PathVariable Long accountId,
                                               @RequestBody @Valid AccountRequest request) {
        return ApiResponse.<AccountResponse>builder()
                .result(accountService.updateAccount(accountId, request))
                .build();
    }

    @DeleteMapping("/{accountId}")
    ApiResponse<Void> deleteAccount(@PathVariable Long accountId) {
        accountService.deleteAccount(accountId);
        return ApiResponse.<Void>builder()
                .message("Account deleted successfully")
                .build();
    }

    @GetMapping
    ApiResponse<List<AccountResponse>> getAccounts() {
        return ApiResponse.<List<AccountResponse>>builder()
                .result(accountService.getAccounts())
                .build();
    }

    @GetMapping("/{accountId}")
    ApiResponse<AccountResponse> getAccount(@PathVariable Long accountId) {
        return ApiResponse.<AccountResponse>builder()
                .result(accountService.getAccount(accountId))
                .build();
    }

    @GetMapping("/{accountId}/transactions")
    ApiResponse<List<TransactionResponse>> getTransactions(@PathVariable Long accountId) {
        return ApiResponse.<List<TransactionResponse>>builder()
                .result(accountService.getAccountTransactions(accountId))
                .build();
    }

    @GetMapping("/summary")
    ApiResponse<List<AccountSummaryResponse>> getAccountSummaries() {
        return ApiResponse.<List<AccountSummaryResponse>>builder()
                .result(accountService.getAccountSummaries())
                .build();
    }
}
