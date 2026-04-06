package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Debt;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.Finma_BE.enums.DebtStatus;
import java.util.List;

public interface DebtRepository extends JpaRepository<Debt,Long> {
    List<Debt> findAllByUserIdAndStatus(Long userId, DebtStatus status);
}
