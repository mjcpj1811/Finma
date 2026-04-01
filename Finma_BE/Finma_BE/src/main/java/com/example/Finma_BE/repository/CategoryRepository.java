package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Lấy tất cả category của user (cả default và riêng của user)
    @Query("SELECT c FROM Category c WHERE c.isDefault = true OR c.user.id = :userId ORDER BY c.name ASC")
    List<Category> findAllByUser(@Param("userId") Long userId);

    // Lấy category theo type (EXPENSE) cho user - dùng để tạo budget
    @Query("SELECT c FROM Category c WHERE (c.isDefault = true OR c.user.id = :userId) " +
           "AND c.type = com.example.Finma_BE.enums.CategoryType.EXPENSE ORDER BY c.name ASC")
    List<Category> findExpenseCategoriesByUser(@Param("userId") Long userId);

    Optional<Category> findByIdAndIsDefaultTrue(Long id);

    @Query("SELECT c FROM Category c WHERE c.id = :id AND (c.isDefault = true OR c.user.id = :userId)")
    Optional<Category> findByIdAccessibleToUser(@Param("id") Long id, @Param("userId") Long userId);
}
