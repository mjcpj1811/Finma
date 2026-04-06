package com.example.Finma_BE.controller;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.response.AccountOptionResponse;
import com.example.Finma_BE.dto.response.CategoryOptionResponse;
import com.example.Finma_BE.enums.CategoryType;
import com.example.Finma_BE.service.AuthContext;
import com.example.Finma_BE.service.FinanceLookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/lookup")
@RequiredArgsConstructor
public class FinanceLookupController {
    private final AuthContext authContext;
    private final FinanceLookupService lookupService;

    @GetMapping("/categories")
    public ApiResponse<List<CategoryOptionResponse>> categories(@RequestParam CategoryType type) {
        var user = authContext.requireCurrentUser();
        var list = lookupService.categories(user, type);
        return ApiResponse.<List<CategoryOptionResponse>>builder()
                .message("OK")
                .result(list)
                .build();
    }

    @GetMapping("/accounts")
    public ApiResponse<List<AccountOptionResponse>> accounts() {
        var user = authContext.requireCurrentUser();
        var list = lookupService.accounts(user);
        return ApiResponse.<List<AccountOptionResponse>>builder()
                .message("OK")
                .result(list)
                .build();
    }
}
