package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BudgetRepository extends JpaRepository<Budget,Long> {
    List<Budget> findAllByUserId(Long userId);
}
