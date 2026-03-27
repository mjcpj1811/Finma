package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<Transaction,Long> {
}
