package com.example.Finma_BE.service;

import com.example.Finma_BE.dto.response.NotificationResponse;
import com.example.Finma_BE.entity.Notification;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.enums.NotificationType;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.repository.NotificationRepository;
import com.example.Finma_BE.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class NotificationService {

    NotificationRepository notificationRepository;
    UserRepository userRepository;

    // ===================== HELPER =====================

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .content(n.getContent())
                .type(n.getType())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    // ===================== INTERNAL (gọi từ các Service khác) =====================

    /**
     * Tạo thông báo nội bộ — được gọi từ BudgetService, GoalService, Scheduler.
     * Có chống duplicate: nếu đã tồn tại thông báo cùng loại + referenceId → bỏ qua.
     */
    @Transactional
    public void createNotification(User user,
                                   NotificationType type,
                                   String title,
                                   String content,
                                   Long referenceId,
                                   String referenceType) {
        // Chống spam: không tạo thông báo trùng loại cho cùng reference
        boolean exists = notificationRepository
                .existsByUserIdAndTypeAndReferenceId(user.getId(), type, referenceId);
        if (exists) {
            log.debug("[Notification] Skip duplicate type={} referenceId={} user={}",
                    type, referenceId, user.getUsername());
            return;
        }

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .content(content)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
        log.info("[Notification] Created type={} for user={} ref={}/{}", type, user.getUsername(), referenceType, referenceId);
    }

    // ===================== APIs =====================

    /** Lấy tất cả thông báo của user hiện tại */
    public List<NotificationResponse> getAllNotifications() {
        User user = getCurrentUser();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /** Lấy thông báo chưa đọc */
    public List<NotificationResponse> getUnreadNotifications() {
        User user = getCurrentUser();
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /** Đếm số thông báo chưa đọc (dùng cho badge trên UI) */
    public long countUnread() {
        User user = getCurrentUser();
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    /** Đánh dấu một thông báo là đã đọc */
    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        User user = getCurrentUser();
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));
        notification.setIsRead(true);
        return mapToResponse(notificationRepository.save(notification));
    }

    /** Đánh dấu tất cả là đã đọc */
    @Transactional
    public void markAllAsRead() {
        User user = getCurrentUser();
        notificationRepository.markAllAsReadByUserId(user.getId());
        log.info("[Notification] Marked all as read for user={}", user.getUsername());
    }

    /** Xoá một thông báo */
    @Transactional
    public void deleteNotification(Long notificationId) {
        User user = getCurrentUser();
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));
        notificationRepository.delete(notification);
    }

    /** Xoá tất cả thông báo đã đọc */
    @Transactional
    public void deleteAllRead() {
        User user = getCurrentUser();
        List<Notification> readNotifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(Notification::getIsRead)
                .collect(Collectors.toList());
        notificationRepository.deleteAll(readNotifications);
        log.info("[Notification] Deleted {} read notifications for user={}",
                readNotifications.size(), user.getUsername());
    }
}
