package com.example.Finma_BE.service;

import com.example.Finma_BE.entity.Budget;
import com.example.Finma_BE.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class BudgetService {

    BudgetRepository budgetRepository;

    public List<Budget> getBudgetsByUserId(Long userId) {
        return budgetRepository.findAllByUserId(userId);
    }
}