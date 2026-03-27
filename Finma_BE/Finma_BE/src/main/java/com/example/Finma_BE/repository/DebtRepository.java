package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Debt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DebtRepository extends JpaRepository<Debt,Long> {
}
