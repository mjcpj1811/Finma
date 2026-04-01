package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Notification;
import com.example.Finma_BE.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** Lấy tất cả thông báo của user, mới nhất trước */
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Lấy thông báo chưa đọc của user */
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    /** Đếm số thông báo chưa đọc của user */
    long countByUserIdAndIsReadFalse(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    /**
     * Kiểm tra đã tồn tại thông báo loại này cho referenceId chưa
     * (tránh gửi thông báo trùng lặp cùng loại cho cùng một budget/goal).
     */
    boolean existsByUserIdAndTypeAndReferenceId(Long userId, NotificationType type, Long referenceId);

    /** Đánh dấu tất cả thông báo của user là đã đọc */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsReadByUserId(@Param("userId") Long userId);
}

