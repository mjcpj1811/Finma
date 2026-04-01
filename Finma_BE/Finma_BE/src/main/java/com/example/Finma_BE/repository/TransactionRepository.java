package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Tính tổng số tiền chi tiêu (EXPENSE) của user theo category trong khoảng thời gian budget
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.category.id = :categoryId " +
           "AND t.type = com.example.Finma_BE.enums.TransactionType.EXPENSE " +
           "AND t.transactionDate >= :startDate " +
           "AND t.transactionDate <= :endDate")
    BigDecimal sumExpenseByCategoryAndPeriod(@Param("userId") Long userId,
                                             @Param("categoryId") Long categoryId,
                                             @Param("startDate") LocalDateTime startDate,
                                             @Param("endDate") LocalDateTime endDate);

    // Tính tổng tiền đã nạp vào một goal (type = SAVING)
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.goal.id = :goalId " +
           "AND t.type = com.example.Finma_BE.enums.TransactionType.SAVING")
    BigDecimal sumSavingByGoalId(@Param("goalId") Long goalId);

    // Lịch sử nạp tiền của một goal, mới nhất trước
    @Query("SELECT t FROM Transaction t " +
           "WHERE t.goal.id = :goalId " +
           "AND t.type = com.example.Finma_BE.enums.TransactionType.SAVING " +
           "ORDER BY t.transactionDate DESC")
    List<Transaction> findSavingsByGoalId(@Param("goalId") Long goalId);

    Optional<Transaction> findByIdAndUserId(Long id, Long userId);
}

