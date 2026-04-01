package com.example.Finma_BE.dto.response;

import com.example.Finma_BE.enums.AccountType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AccountOptionResponse {
    private Long id;
    private String name;
    private AccountType type;
    private BigDecimal balance;
}
