package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Account;
import com.example.Finma_BE.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category,Long> {
    Optional<Category> findByIdAndUserId(Long id, Long userId);
}
