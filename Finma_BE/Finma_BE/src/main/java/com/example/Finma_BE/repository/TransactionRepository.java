package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>,
        JpaSpecificationExecutor<Transaction>{

    // Tính tổng số tiền chi tiêu (EXPENSE) của user theo category trong khoảng thời gian budget
    /**
     * Tính tổng giao dịch chi tiêu theo một danh mục và khoảng thời gian. Phần
     * tổng hợp liên quan dùng giá trị này làm ngữ cảnh chi tiêu.
     */
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
    /**
     * Tính tổng giao dịch SAVING của một mục tiêu.
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.goal.id = :goalId " +
           "AND t.type = com.example.Finma_BE.enums.TransactionType.SAVING")
    BigDecimal sumSavingByGoalId(@Param("goalId") Long goalId);

    // Lịch sử nạp tiền của một goal, mới nhất trước
    /**
     * Trả về các giao dịch SAVING liên kết với một mục tiêu, mới nhất trước.
     */
    @Query("SELECT t FROM Transaction t " +
           "WHERE t.goal.id = :goalId " +
           "AND t.type = com.example.Finma_BE.enums.TransactionType.SAVING " +
           "ORDER BY t.transactionDate DESC")
    List<Transaction> findSavingsByGoalId(@Param("goalId") Long goalId);

    Optional<Transaction> findByIdAndUserId(Long id, Long userId);

    List<Transaction> findAllByAccountIdOrderByCreatedAtDesc(Long accountId);
    List<Transaction> findAllByAccountIdAndUserIdOrderByTransactionDateDesc(Long accountId, Long userId);
    List<Transaction> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    long countByAccountId(Long accountId);
    void deleteAllByAccountId(Long accountId);
    void deleteAllByGoalId(Long goalId);

    /**
     * Kiểm tra user có giao dịch nào trong khoảng ngày nửa mở hay không.
     */
    @Query("SELECT COUNT(t) > 0 FROM Transaction t WHERE t.user.id = :userId " +
           "AND t.transactionDate >= :start " +
           "AND t.transactionDate < :end")
    boolean existsByUserIdAndDate(@Param("userId") Long userId, 
                                  @Param("start") java.time.LocalDateTime start, 
                                  @Param("end") java.time.LocalDateTime end);

    /**
     * Hàm nạp chồng tiện dụng cho một ngày lịch đầy đủ.
     */
    default boolean existsByUserIdAndDate(Long userId, java.time.LocalDate date) {
        java.time.LocalDateTime start = date.atStartOfDay();
        java.time.LocalDateTime end = date.plusDays(1).atStartOfDay();
        return existsByUserIdAndDate(userId, start, end);
    }
}

