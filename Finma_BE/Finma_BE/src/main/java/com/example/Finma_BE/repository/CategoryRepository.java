package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category,Long> {
}
