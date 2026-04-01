package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Debt;
import com.example.Finma_BE.enums.DebtStatus;
import com.example.Finma_BE.enums.DebtType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DebtRepository extends JpaRepository<Debt,Long> {
    // Lấy tất cả debt của user, kèm payments
    @Query("SELECT DISTINCT d FROM Debt d " +
            "LEFT JOIN FETCH d.payments " +
            "WHERE d.user.id = :userId " +
            "ORDER BY d.createdAt DESC")
    List<Debt> findAllByUserIdWithPayments(@Param("userId") Long userId);

    // Lấy theo type
    @Query("SELECT DISTINCT d FROM Debt d " +
            "LEFT JOIN FETCH d.payments " +
            "WHERE d.user.id = :userId AND d.type = :type " +
            "ORDER BY d.createdAt DESC")
    List<Debt> findByUserIdAndTypeWithPayments(
            @Param("userId") Long userId,
            @Param("type") DebtType type);

    // Lấy 1 debt (bảo mật theo userId)
    Optional<Debt> findByIdAndUserId(Long id, Long userId);

    // Tổng tiền cho vay còn lại (LEND - ONGOING)
    @Query("SELECT COALESCE(SUM(d.totalAmount), 0) FROM Debt d " +
            "WHERE d.user.id = :userId AND d.type = 'LEND' AND d.status = 'ONGOING'")
    BigDecimal sumActiveLend(@Param("userId") Long userId);

    // Tổng tiền đang vay còn lại (LOAN - ONGOING)
    @Query("SELECT COALESCE(SUM(d.totalAmount), 0) FROM Debt d " +
            "WHERE d.user.id = :userId AND d.type = 'LOAN' AND d.status = 'ONGOING'")
    BigDecimal sumActiveLoan(@Param("userId") Long userId);

    // Đếm theo type và status (cho header stats)
    int countByUserIdAndTypeAndStatus(Long userId, DebtType type, DebtStatus status);

    // Tìm các khoản quá hạn để auto-update status
    @Query("SELECT d FROM Debt d " +
            "WHERE d.status = 'ONGOING' AND d.dueDate < :today")
    List<Debt> findOverdueDebts(@Param("today") LocalDate today);
}

