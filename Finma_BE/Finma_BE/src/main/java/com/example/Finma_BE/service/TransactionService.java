package com.example.Finma_BE.service;

import com.example.Finma_BE.entity.Transaction;
import com.example.Finma_BE.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class TransactionService {

    TransactionRepository transactionRepository;

    public List<Transaction> getRecentTransactionsByUserId(Long userId, int limit) {
        return transactionRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream().limit(limit).collect(Collectors.toList());
    }
}