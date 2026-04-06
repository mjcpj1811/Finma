package com.example.Finma_BE.controller;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.response.NotificationResponse;
import com.example.Finma_BE.service.NotificationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/notifications")
public class NotificationController {

    NotificationService notificationService;

    /**
     * GET /notifications
     * Lấy tất cả thông báo của user (mới nhất trước)
     */
    @GetMapping
    ApiResponse<List<NotificationResponse>> getAll() {
        return ApiResponse.<List<NotificationResponse>>builder()
                .result(notificationService.getAllNotifications())
                .build();
    }

    /**
     * GET /notifications/unread
     * Lấy các thông báo chưa đọc
     */
    @GetMapping("/unread")
    ApiResponse<List<NotificationResponse>> getUnread() {
        return ApiResponse.<List<NotificationResponse>>builder()
                .result(notificationService.getUnreadNotifications())
                .build();
    }

    /**
     * GET /notifications/unread/count
     * Số thông báo chưa đọc (dùng cho badge UI)
     */
    @GetMapping("/unread/count")
    ApiResponse<Long> countUnread() {
        return ApiResponse.<Long>builder()
                .result(notificationService.countUnread())
                .build();
    }

    /**
     * PATCH /notifications/{id}/read
     * Đánh dấu một thông báo là đã đọc
     */
    @PatchMapping("/{id}/read")
    ApiResponse<NotificationResponse> markAsRead(@PathVariable Long id) {
        return ApiResponse.<NotificationResponse>builder()
                .result(notificationService.markAsRead(id))
                .build();
    }

    /**
     * PATCH /notifications/read-all
     * Đánh dấu tất cả là đã đọc
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
     * Xoá một thông báo
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
     * Xoá tất cả thông báo đã đọc
     */
    @DeleteMapping("/read")
    ApiResponse<Void> deleteAllRead() {
        notificationService.deleteAllRead();
        return ApiResponse.<Void>builder()
                .message("All read notifications deleted")
                .build();
    }
}
