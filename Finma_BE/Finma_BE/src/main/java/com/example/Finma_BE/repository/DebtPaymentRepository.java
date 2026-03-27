package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.DebtPayment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DebtPaymentRepository extends JpaRepository<DebtPayment,Long> {
}
