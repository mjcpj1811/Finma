package com.example.Finma_BE.service;

import com.example.Finma_BE.dto.response.AccountOptionResponse;
import com.example.Finma_BE.dto.response.CategoryOptionResponse;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.enums.CategoryType;
import com.example.Finma_BE.exception.ApiException;
import com.example.Finma_BE.repository.AccountRepository;
import com.example.Finma_BE.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FinanceLookupService {
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;

    public List<CategoryOptionResponse> categories(User user, CategoryType type) {
        if (type == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "type is required (EXPENSE or INCOME)");
        }
        return categoryRepository.findByUser_IdAndType(user.getId(), type).stream()
                .map(c -> CategoryOptionResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .type(c.getType())
                        .build())
                .toList();
    }

    public List<AccountOptionResponse> accounts(User user) {
        return accountRepository.findByUser_Id(user.getId()).stream()
                .map(a -> AccountOptionResponse.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .type(a.getType())
                        .balance(a.getBalance())
                        .build())
                .toList();
    }
}
