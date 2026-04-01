package com.example.Finma_BE.controller;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.request.GoalDepositRequest;
import com.example.Finma_BE.dto.request.GoalRequest;
import com.example.Finma_BE.dto.response.GoalDepositResponse;
import com.example.Finma_BE.dto.response.GoalResponse;
import com.example.Finma_BE.enums.GoalStatus;
import com.example.Finma_BE.service.GoalService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/goals")
public class GoalController {

    GoalService goalService;

    // ==================== GOAL ====================

    /**
     * POST /goals
     * Tạo mục tiêu tiết kiệm mới
     */
    @PostMapping
    ApiResponse<GoalResponse> createGoal(@RequestBody @Valid GoalRequest request) {
        return ApiResponse.<GoalResponse>builder()
                .result(goalService.createGoal(request))
                .message("Goal created successfully")
                .build();
    }

    /**
     * GET /goals
     * Lấy tất cả mục tiêu của user
     */
    @GetMapping
    ApiResponse<List<GoalResponse>> getAllGoals() {
        return ApiResponse.<List<GoalResponse>>builder()
                .result(goalService.getAllGoals())
                .build();
    }

    /**
     * GET /goals?status=IN_PROGRESS
     * Lấy mục tiêu theo trạng thái (IN_PROGRESS / COMPLETED / CANCELLED)
     */
    @GetMapping("/filter")
    ApiResponse<List<GoalResponse>> getGoalsByStatus(@RequestParam GoalStatus status) {
        return ApiResponse.<List<GoalResponse>>builder()
                .result(goalService.getGoalsByStatus(status))
                .build();
    }

    /**
     * GET /goals/{id}
     * Xem chi tiết mục tiêu + tiến độ + tính toán tiết kiệm cần thiết
     */
    @GetMapping("/{id}")
    ApiResponse<GoalResponse> getGoal(@PathVariable Long id) {
        return ApiResponse.<GoalResponse>builder()
                .result(goalService.getGoal(id))
                .build();
    }

    /**
     * PUT /goals/{id}
     * Cập nhật thông tin mục tiêu
     */
    @PutMapping("/{id}")
    ApiResponse<GoalResponse> updateGoal(
            @PathVariable Long id,
            @RequestBody @Valid GoalRequest request) {
        return ApiResponse.<GoalResponse>builder()
                .result(goalService.updateGoal(id, request))
                .message("Goal updated successfully")
                .build();
    }

    /**
     * PATCH /goals/{id}/cancel
     * Huỷ mục tiêu (chuyển sang CANCELLED)
     */
    @PatchMapping("/{id}/cancel")
    ApiResponse<GoalResponse> cancelGoal(@PathVariable Long id) {
        return ApiResponse.<GoalResponse>builder()
                .result(goalService.cancelGoal(id))
                .message("Goal cancelled")
                .build();
    }

    /**
     * DELETE /goals/{id}
     * Xoá mục tiêu và toàn bộ lịch sử nạp tiền
     */
    @DeleteMapping("/{id}")
    ApiResponse<Void> deleteGoal(@PathVariable Long id) {
        goalService.deleteGoal(id);
        return ApiResponse.<Void>builder()
                .message("Goal deleted successfully")
                .build();
    }

    // ==================== DEPOSITS ====================

    /**
     * POST /goals/deposits
     * Nạp tiền vào mục tiêu tiết kiệm
     */
    @PostMapping("/deposits")
    ApiResponse<GoalDepositResponse> addDeposit(@RequestBody @Valid GoalDepositRequest request) {
        return ApiResponse.<GoalDepositResponse>builder()
                .result(goalService.addDeposit(request))
                .message("Deposit added successfully")
                .build();
    }

    /**
     * GET /goals/{id}/deposits
     * Lấy lịch sử nạp tiền của một mục tiêu
     */
    @GetMapping("/{id}/deposits")
    ApiResponse<List<GoalDepositResponse>> getDeposits(@PathVariable Long id) {
        return ApiResponse.<List<GoalDepositResponse>>builder()
                .result(goalService.getDeposits(id))
                .build();
    }

    /**
     * DELETE /goals/deposits/{depositId}
     * Xoá (hoàn tác) một lần nạp tiền
     */
    @DeleteMapping("/deposits/{depositId}")
    ApiResponse<Void> deleteDeposit(@PathVariable Long depositId) {
        goalService.deleteDeposit(depositId);
        return ApiResponse.<Void>builder()
                .message("Deposit deleted successfully")
                .build();
    }
}
