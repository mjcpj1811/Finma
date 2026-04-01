package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Kiểm tra đã tồn tại budget cho category đó trong cùng khoảng thời gian chưa
    @Query("SELECT COUNT(b) > 0 FROM Budget b WHERE b.user.id = :userId " +
           "AND b.category.id = :categoryId " +
           "AND b.startDate <= :endDate AND b.endDate >= :startDate " +
           "AND (:excludeId IS NULL OR b.id <> :excludeId)")
    boolean existsOverlappingBudget(@Param("userId") Long userId,
                                    @Param("categoryId") Long categoryId,
                                    @Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    @Param("excludeId") Long excludeId);

    // Lấy danh sách budget đang active (ngày hiện tại nằm trong khoảng)
    @Query("SELECT b FROM Budget b WHERE b.user.id = :userId " +
           "AND b.startDate <= :today AND b.endDate >= :today " +
           "ORDER BY b.category.name ASC")
    List<Budget> findActiveBudgetsByUser(@Param("userId") Long userId,
                                         @Param("today") LocalDate today);

    Optional<Budget> findByIdAndUserId(Long id, Long userId);

    /**
     * Lấy tất cả recurring budget gốc (do user tự tạo, chưa phải bản sinh tự động)
     * để scheduler dùng tạo bản mới đầu tháng.
     */
    @Query("SELECT b FROM Budget b WHERE b.isRecurring = true AND b.parentBudgetId IS NULL")
    List<Budget> findAllRecurringRootBudgets();

    /**
     * Kiểm tra budget cho category này của user đã tồn tại trong tháng chưa
     * (dùng để tránh sinh trùng lặp khi scheduler chạy).
     */
    @Query("SELECT COUNT(b) > 0 FROM Budget b WHERE b.user.id = :userId " +
           "AND b.category.id = :categoryId " +
           "AND b.startDate = :startDate")
    boolean existsByUserAndCategoryAndStartDate(@Param("userId") Long userId,
                                                @Param("categoryId") Long categoryId,
                                                @Param("startDate") LocalDate startDate);
}
