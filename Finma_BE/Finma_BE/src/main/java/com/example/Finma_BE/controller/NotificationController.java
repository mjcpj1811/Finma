package com.example.Finma_BE.controller;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.response.NotificationResponse;
import com.example.Finma_BE.service.NotificationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý các yêu cầu liên quan đến hệ thống thông báo (Notification).
 * Cung cấp các API để xem thông báo, đánh dấu đã đọc, đếm số lượng chưa đọc và xóa thông báo.
 * 
 * @author Nhóm 09 - PTIT
 */
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/notifications")
public class NotificationController {

    // Service xử lý nghiệp vụ của hệ thống thông báo
    NotificationService notificationService;

    /**
     * GET /notifications
     * Lấy danh sách tất cả thông báo của người dùng hiện tại, sắp xếp theo thời gian mới nhất trước.
     *
     * @return ApiResponse chứa danh sách phản hồi của các thông báo
     */
    @GetMapping
    ApiResponse<List<NotificationResponse>> getAll() {
        return ApiResponse.<List<NotificationResponse>>builder()
                .result(notificationService.getAllNotifications())
                .build();
    }

    /**
     * GET /notifications/unread
     * Lấy danh sách các thông báo chưa đọc của người dùng hiện tại.
     *
     * @return ApiResponse chứa danh sách các thông báo chưa đọc
     */
    @GetMapping("/unread")
    ApiResponse<List<NotificationResponse>> getUnread() {
        return ApiResponse.<List<NotificationResponse>>builder()
                .result(notificationService.getUnreadNotifications())
                .build();
    }

    /**
     * GET /notifications/unread/count
     * Lấy số lượng thông báo chưa đọc (dùng để hiển thị badge số lượng thông báo trên giao diện di động).
     *
     * @return ApiResponse chứa số lượng thông báo chưa đọc
     */
    @GetMapping("/unread/count")
    ApiResponse<Long> countUnread() {
        return ApiResponse.<Long>builder()
                .result(notificationService.countUnread())
                .build();
    }

    /**
     * PATCH /notifications/{id}/read
     * Đánh dấu một thông báo cụ thể theo ID là đã đọc.
     *
     * @param id ID của thông báo cần đánh dấu là đã đọc
     * @return ApiResponse chứa thông tin chi tiết của thông báo sau khi cập nhật
     */
    @PatchMapping("/{id}/read")
    ApiResponse<NotificationResponse> markAsRead(@PathVariable Long id) {
        return ApiResponse.<NotificationResponse>builder()
                .result(notificationService.markAsRead(id))
                .build();
    }

    /**
     * PATCH /notifications/read-all
     * Đánh dấu toàn bộ tất cả thông báo chưa đọc của người dùng hiện tại là đã đọc.
     *
     * @return ApiResponse rỗng kèm thông báo thành công
     */
    @PatchMapping("/read-all")
    ApiResponse<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ApiResponse.<Void>builder()
                .message("All notifications marked as read")
                .build();
    }

    /**
     * DELETE /notifications/{id}
     * Xóa một thông báo cụ thể theo ID.
     *
     * @param id ID của thông báo cần xóa
     * @return ApiResponse rỗng kèm thông báo thành công
     */
    @DeleteMapping("/{id}")
    ApiResponse<Void> delete(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ApiResponse.<Void>builder()
                .message("Notification deleted")
                .build();
    }

    /**
     * DELETE /notifications/read
     * Xóa tất cả các thông báo đã đọc của người dùng hiện tại để dọn dẹp bộ nhớ.
     *
     * @return ApiResponse rỗng kèm thông báo thành công
     */
    @DeleteMapping("/read")
    ApiResponse<Void> deleteAllRead() {
        notificationService.deleteAllRead();
        return ApiResponse.<Void>builder()
                .message("All read notifications deleted")
                .build();
    }
}
