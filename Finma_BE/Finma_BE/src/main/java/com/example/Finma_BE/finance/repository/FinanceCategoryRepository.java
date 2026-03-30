package com.example.Finma_BE.finance.repository;

import com.example.Finma_BE.entity.Category;
import com.example.Finma_BE.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinanceCategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUser_IdAndType(Long userId, CategoryType type);
}

