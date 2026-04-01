package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Account;
import com.example.Finma_BE.entity.Category;
import com.example.Finma_BE.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category,Long> {

    //Tìm 1 danh mục theo id + userId
    Optional<Category> findByIdAndUserId(Long id, Long userId);

    //Lấy tất cả danh mục gốc (parent = null) của user, lọc theo type nếu có
    @Query("SELECT c FROM Category c WHERE c.user.id = :userId AND c.parent IS NULL " +
            "AND (:type IS NULL OR c.type = :type) ORDER BY c.isDefault DESC, c.name ASC")
    List<Category> findRootCategoriesByUser(@Param("userId") Long userId,
                                            @Param("type") CategoryType type);

    //Lấy tất cả danh mục con trực tiếp của một danh mục cha
    List<Category> findByParentIdOrderByNameAsc(Long parentId);

    //Lấy toàn bộ danh mục của user (kể cả con), dùng để build cây phẳng
    List<Category> findByUserIdOrderByIsDefaultDescNameAsc(Long userId);

    //Kiểm tra tên trùng trong cùng user + type + cùng parent
    boolean existsByUserIdAndTypeAndNameAndParentId(Long userId, CategoryType type,
                                                    String name, Long parentId);

    //Kiểm tra còn giao dịch nào dùng danh mục này không
    @Query("SELECT COUNT(t) > 0 FROM Transaction t WHERE t.category.id = :categoryId")
    boolean hasTransactions(@Param("categoryId") Long categoryId);
}
