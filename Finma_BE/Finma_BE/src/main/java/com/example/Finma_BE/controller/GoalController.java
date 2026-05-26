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

/**
 * Controller xử lý các yêu cầu liên quan đến quản lý mục tiêu tiết kiệm (Goal).
 * Cung cấp các API để tạo, cập nhật, hủy, xóa mục tiêu và nạp tiền (deposit) vào mục tiêu.
 * 
 * @author Nhóm 09 - PTIT
 */
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/goals")
public class GoalController {

    // Service xử lý nghiệp vụ của mục tiêu tiết kiệm
    GoalService goalService;

    // ==================== GOAL CRUD ====================

    /**
     * POST /goals
     * Tạo một mục tiêu tiết kiệm mới.
     *
     * @param request thông tin chi tiết về mục tiêu (tên, số tiền đích, hạn chót, v.v.)
     * @return ApiResponse chứa thông tin mục tiêu tiết kiệm vừa được tạo
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
     * Lấy danh sách tất cả các mục tiêu tiết kiệm của người dùng hiện tại.
     * Kèm theo tiến độ % và số tiền cần tiết kiệm ước tính hàng ngày/hàng tháng.
     *
     * @return ApiResponse chứa danh sách các mục tiêu tiết kiệm
     */
    @GetMapping
    ApiResponse<List<GoalResponse>> getAllGoals() {
        return ApiResponse.<List<GoalResponse>>builder()
                .result(goalService.getAllGoals())
                .build();
    }

    /**
     * GET /goals/filter?status=IN_PROGRESS
     * Lấy danh sách các mục tiêu tiết kiệm được lọc theo trạng thái (IN_PROGRESS, COMPLETED, CANCELLED).
     *
     * @param status trạng thái của mục tiêu tiết kiệm cần lọc
     * @return ApiResponse chứa danh sách các mục tiêu thỏa mãn bộ lọc
     */
    @GetMapping("/filter")
    ApiResponse<List<GoalResponse>> getGoalsByStatus(@RequestParam GoalStatus status) {
        return ApiResponse.<List<GoalResponse>>builder()
                .result(goalService.getGoalsByStatus(status))
                .build();
    }

    /**
     * GET /goals/{id}
     * Xem thông tin chi tiết của một mục tiêu tiết kiệm theo ID.
     * Bao gồm tính toán chi tiết số ngày còn lại và số tiền cần nạp hàng ngày/tháng.
     *
     * @param id ID của mục tiêu cần truy vấn
     * @return ApiResponse chứa thông tin chi tiết mục tiêu tiết kiệm
     */
    @GetMapping("/{id}")
    ApiResponse<GoalResponse> getGoal(@PathVariable Long id) {
        return ApiResponse.<GoalResponse>builder()
                .result(goalService.getGoal(id))
                .build();
    }

    /**
     * PUT /goals/{id}
     * Cập nhật thông tin chi tiết mục tiêu tiết kiệm (tên, mô tả, số tiền đích, hạn chót, biểu tượng, màu sắc).
     * Chỉ cho phép sửa khi mục tiêu đang ở trạng thái IN_PROGRESS.
     *
     * @param id ID của mục tiêu cần cập nhật
     * @param request thông tin mới cần cập nhật
     * @return ApiResponse chứa thông tin mục tiêu sau khi cập nhật
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
     * Hủy bỏ mục tiêu tiết kiệm (chuyển trạng thái sang CANCELLED).
     *
     * @param id ID của mục tiêu tiết kiệm muốn hủy
     * @return ApiResponse chứa thông tin mục tiêu sau khi hủy
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
     * Xóa hoàn toàn một mục tiêu tiết kiệm cùng với tất cả lịch sử giao dịch nạp tiền liên quan.
     *
     * @param id ID của mục tiêu tiết kiệm cần xóa
     * @return ApiResponse rỗng kèm thông báo thành công
     */
    @DeleteMapping("/{id}")
    ApiResponse<Void> deleteGoal(@PathVariable Long id) {
        goalService.deleteGoal(id);
        return ApiResponse.<Void>builder()
                .message("Goal deleted successfully")
                .build();
    }

    // ==================== DEPOSITS (Giao dịch nạp tiết kiệm) ====================

    /**
     * POST /goals/deposits
     * Nạp tiền vào mục tiêu tiết kiệm (tạo giao dịch SAVING và trừ số dư tài khoản tương ứng).
     * Nếu nạp đủ số tiền mục tiêu, trạng thái mục tiêu sẽ tự động chuyển sang COMPLETED.
     *
     * @param request thông tin yêu cầu nạp tiền (ID mục tiêu, số tiền nạp, tài khoản nguồn, ngày nạp, v.v.)
     * @return ApiResponse chứa thông tin giao dịch nạp tiền vừa thực hiện
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
     * Lấy lịch sử tất cả các lần nạp tiền của một mục tiêu tiết kiệm cụ thể.
     *
     * @param id ID của mục tiêu tiết kiệm
     * @return ApiResponse chứa danh sách lịch sử nạp tiền
     */
    @GetMapping("/{id}/deposits")
    ApiResponse<List<GoalDepositResponse>> getDeposits(@PathVariable Long id) {
        return ApiResponse.<List<GoalDepositResponse>>builder()
                .result(goalService.getDeposits(id))
                .build();
    }

    /**
     * DELETE /goals/deposits/{depositId}
     * Xóa (hoàn tác) một lần nạp tiền tiết kiệm cụ thể.
     * Số tiền nạp sẽ được hoàn lại tài khoản nguồn. Nếu tổng số tiền tích lũy giảm xuống dưới mục tiêu,
     * trạng thái mục tiêu sẽ chuyển ngược từ COMPLETED về IN_PROGRESS.
     *
     * @param depositId ID của giao dịch nạp tiền cần xóa
     * @return ApiResponse rỗng kèm thông báo thành công
     */
    @DeleteMapping("/deposits/{depositId}")
    ApiResponse<Void> deleteDeposit(@PathVariable Long depositId) {
        goalService.deleteDeposit(depositId);
        return ApiResponse.<Void>builder()
                .message("Deposit deleted successfully")
                .build();
    }
}
