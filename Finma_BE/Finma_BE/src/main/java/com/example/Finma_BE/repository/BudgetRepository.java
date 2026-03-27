package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetRepository extends JpaRepository<Budget,Long> {
}
