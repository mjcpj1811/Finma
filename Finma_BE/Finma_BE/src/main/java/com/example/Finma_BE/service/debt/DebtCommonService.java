package com.example.Finma_BE.service.debt;

import com.example.Finma_BE.entity.Debt;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.repository.DebtRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class DebtCommonService {
    private final DebtRepository debtRepository;

    public Debt findDebtOfUser(Long id, Long userId) {
        return debtRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(() ->
                        new AppException(ErrorCode.DEBT_NOT_FOUND));
    }
}
