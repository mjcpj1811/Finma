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

/**
 * Controller xử lý các yêu cầu liên quan đến quản lý ngân sách (Budget).
 * Cung cấp các API để lấy danh mục chi tiêu, tạo, cập nhật, xóa và truy vấn ngân sách.
 * 
 * @author Nhóm 09 - PTIT
 */
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/budgets")
public class BudgetController {

    // Service xử lý nghiệp vụ của ngân sách
    BudgetService budgetService;

    /**
     * GET /budgets/categories
     * Lấy danh sách danh mục (EXPENSE) khả dụng để người dùng thiết lập ngân sách.
     * Chỉ những danh mục thuộc loại chi tiêu mới được phép tạo ngân sách.
     *
     * @return ApiResponse chứa danh sách phản hồi của các danh mục khả dụng
     */
    @GetMapping("/categories")
    ApiResponse<List<CategoryResponse>> getAvailableCategories() {
        return ApiResponse.<List<CategoryResponse>>builder()
                .result(budgetService.getAvailableCategories())
                .build();
    }

    /**
     * POST /budgets
     * Tạo một ngân sách mới cho một danh mục chi tiêu cụ thể.
     *
     * @param request thông tin yêu cầu tạo ngân sách (bao gồm hạn mức, kỳ hạn, danh mục, v.v.)
     * @return ApiResponse chứa thông tin chi tiết ngân sách vừa tạo
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
     * Lấy danh sách toàn bộ ngân sách của người dùng hiện tại (bao gồm cả lịch sử).
     * Phản hồi kèm theo số tiền đã chi tiêu và tỷ lệ phần trăm sử dụng hiện tại.
     *
     * @return ApiResponse chứa danh sách tất cả ngân sách của người dùng
     */
    @GetMapping
    ApiResponse<List<BudgetResponse>> getAllBudgets() {
        return ApiResponse.<List<BudgetResponse>>builder()
                .result(budgetService.getAllBudgets())
                .build();
    }

    /**
     * GET /budgets/active
     * Lấy danh sách các ngân sách đang trong kỳ hạn hoạt động (ngày hiện tại nằm trong khoảng bắt đầu và kết thúc).
     *
     * @return ApiResponse chứa danh sách các ngân sách đang hoạt động
     */
    @GetMapping("/active")
    ApiResponse<List<BudgetResponse>> getActiveBudgets() {
        return ApiResponse.<List<BudgetResponse>>builder()
                .result(budgetService.getActiveBudgets())
                .build();
    }

    /**
     * GET /budgets/{id}
     * Xem thông tin chi tiết của một ngân sách cụ thể theo ID.
     *
     * @param id ID của ngân sách cần truy vấn
     * @return ApiResponse chứa thông tin chi tiết của ngân sách
     */
    @GetMapping("/{id}")
    ApiResponse<BudgetResponse> getBudget(@PathVariable Long id) {
        return ApiResponse.<BudgetResponse>builder()
                .result(budgetService.getBudget(id))
                .build();
    }

    /**
     * PUT /budgets/{id}
     * Cập nhật thông tin của một ngân sách hiện tại (hạn mức, kỳ hạn, thời gian, danh mục).
     *
     * @param id ID của ngân sách cần cập nhật
     * @param request thông tin cập nhật mới
     * @return ApiResponse chứa thông tin chi tiết ngân sách sau khi cập nhật
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
     * Xóa một ngân sách cụ thể theo ID.
     *
     * @param id ID của ngân sách cần xóa
     * @return ApiResponse rỗng kèm thông báo thành công
     */
    @DeleteMapping("/{id}")
    ApiResponse<Void> deleteBudget(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ApiResponse.<Void>builder()
                .message("Budget deleted successfully")
                .build();
    }
}
