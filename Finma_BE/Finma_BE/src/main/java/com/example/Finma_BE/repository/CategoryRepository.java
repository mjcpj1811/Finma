package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Category;
import com.example.Finma_BE.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByUser_IdAndType(Long userId, CategoryType type);

    Optional<Category> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId AND c.parent IS NULL " +
            "AND (:type IS NULL OR c.type = :type) ORDER BY c.isDefault DESC, c.name ASC")
    List<Category> findRootCategoriesByUser(@Param("userId") Long userId,
                                            @Param("type") CategoryType type);

    List<Category> findByParentIdOrderByNameAsc(Long parentId);

    List<Category> findByUserIdOrderByIsDefaultDescNameAsc(Long userId);

    boolean existsByUserIdAndTypeAndNameAndParentId(Long userId, CategoryType type,
                                                    String name, Long parentId);

    @Query("SELECT COUNT(t) > 0 FROM Transaction t WHERE t.category.id = :categoryId")
    boolean hasTransactions(@Param("categoryId") Long categoryId);
}
