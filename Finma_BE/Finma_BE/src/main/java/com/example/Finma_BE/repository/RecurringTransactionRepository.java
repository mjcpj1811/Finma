package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction,Long> {
}
