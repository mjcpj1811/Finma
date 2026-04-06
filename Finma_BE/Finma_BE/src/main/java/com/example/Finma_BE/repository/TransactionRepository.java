package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction,Long> {
    List<Transaction> findAllByAccountIdOrderByCreatedAtDesc(Long accountId);
    List<Transaction> findAllByAccountIdAndUserIdOrderByTransactionDateDesc(Long accountId, Long userId);
    List<Transaction> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    long countByAccountId(Long accountId);
    void deleteAllByAccountId(Long accountId);
}
