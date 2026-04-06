package com.example.Finma_BE.service;

import com.example.Finma_BE.entity.Debt;
import com.example.Finma_BE.enums.DebtStatus;
import com.example.Finma_BE.repository.DebtRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class DebtService {

    DebtRepository debtRepository;

    public List<Debt> getActiveDebtsByUserId(Long userId) {
        return debtRepository.findAllByUserIdAndStatus(userId, DebtStatus.ONGOING);
    }
}