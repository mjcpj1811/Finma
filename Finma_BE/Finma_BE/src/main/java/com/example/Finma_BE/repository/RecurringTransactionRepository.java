package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.RecurringTransaction;
import com.example.Finma_BE.enums.RecurringStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction,Long> {

    // Danh sách tất cả (trừ CANCELLED), kèm JOIN category & account tránh N+1
    @Query("SELECT r FROM RecurringTransaction r " +
            "LEFT JOIN FETCH r.category " +
            "LEFT JOIN FETCH r.account " +
            "WHERE r.user.id = :userId " +
            "AND r.status != 'CANCELLED' " +
            "ORDER BY r.createdAt DESC")
    List<RecurringTransaction> findAllActiveByUserId(@Param("userId") Long userId);

    // Lọc theo status cụ thể
    @Query("SELECT r FROM RecurringTransaction r " +
            "LEFT JOIN FETCH r.category " +
            "LEFT JOIN FETCH r.account " +
            "WHERE r.user.id = :userId AND r.status = :status " +
            "ORDER BY r.createdAt DESC")
    List<RecurringTransaction> findByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") RecurringStatus status);

    // Get 1 - bảo mật theo userId
    @Query("SELECT r FROM RecurringTransaction r " +
            "LEFT JOIN FETCH r.category " +
            "LEFT JOIN FETCH r.account " +
            "WHERE r.id = :id AND r.user.id = :userId")
    Optional<RecurringTransaction> findByIdAndUserId(
            @Param("id") Long id,
            @Param("userId") Long userId);

    // Đếm số đang ACTIVE + isActive=true (cho header stats)
    int countByUserIdAndStatusAndIsActive(Long userId, RecurringStatus status, Boolean isActive);

    // Tổng chi tiêu hàng tháng (quy đổi: DAILY×30, WEEKLY×4, MONTHLY×1, YEARLY÷12)
    @Query("""
           SELECT COALESCE(SUM(
               CASE r.frequency
                   WHEN 'DAILY'   THEN r.amount * 30
                   WHEN 'WEEKLY'  THEN r.amount * 4
                   WHEN 'MONTHLY' THEN r.amount
                   WHEN 'YEARLY'  THEN r.amount / 12
               END
           ), 0)
           FROM RecurringTransaction r
           WHERE r.user.id = :userId
             AND r.status = 'ACTIVE'
             AND r.isActive = true
           """)
    BigDecimal sumMonthlyExpense(@Param("userId") Long userId);
}
