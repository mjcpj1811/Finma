package com.example.Finma_BE.controller;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.request.BudgetRequest;
import com.example.Finma_BE.dto.response.BudgetResponse;
import com.example.Finma_BE.dto.response.CategoryResponse;
import com.example.Finma_BE.service.BudgetService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/budgets")
public class BudgetController {

    BudgetService budgetService;

    /**
     * GET /budgets/categories
     * Lấy danh sách category (EXPENSE) có sẵn để tạo ngân sách
     */
    @GetMapping("/categories")
    ApiResponse<List<CategoryResponse>> getAvailableCategories() {
        return ApiResponse.<List<CategoryResponse>>builder()
                .result(budgetService.getAvailableCategories())
                .build();
    }

    /**
     * POST /budgets
     * Tạo ngân sách mới từ một category cho sẵn
     */
    @PostMapping
    ApiResponse<BudgetResponse> createBudget(@RequestBody @Valid BudgetRequest request) {
        return ApiResponse.<BudgetResponse>builder()
                .result(budgetService.createBudget(request))
                .message("Budget created successfully")
                .build();
    }

    /**
     * GET /budgets
     * Lấy toàn bộ ngân sách của user (kèm % đã dùng)
     */
    @GetMapping
    ApiResponse<List<BudgetResponse>> getAllBudgets() {
        return ApiResponse.<List<BudgetResponse>>builder()
                .result(budgetService.getAllBudgets())
                .build();
    }

    /**
     * GET /budgets/active
     * Lấy các ngân sách đang trong kỳ hiện tại
     */
    @GetMapping("/active")
    ApiResponse<List<BudgetResponse>> getActiveBudgets() {
        return ApiResponse.<List<BudgetResponse>>builder()
                .result(budgetService.getActiveBudgets())
                .build();
    }

    /**
     * GET /budgets/{id}
     * Xem chi tiết một ngân sách
     */
    @GetMapping("/{id}")
    ApiResponse<BudgetResponse> getBudget(@PathVariable Long id) {
        return ApiResponse.<BudgetResponse>builder()
                .result(budgetService.getBudget(id))
                .build();
    }

    /**
     * PUT /budgets/{id}
     * Cập nhật ngân sách (hạn mức, kỳ, ngày, category)
     */
    @PutMapping("/{id}")
    ApiResponse<BudgetResponse> updateBudget(
            @PathVariable Long id,
            @RequestBody @Valid BudgetRequest request) {
        return ApiResponse.<BudgetResponse>builder()
                .result(budgetService.updateBudget(id, request))
                .message("Budget updated successfully")
                .build();
    }

    /**
     * DELETE /budgets/{id}
     * Xoá ngân sách
     */
    @DeleteMapping("/{id}")
    ApiResponse<Void> deleteBudget(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ApiResponse.<Void>builder()
                .message("Budget deleted successfully")
                .build();
    }
}
