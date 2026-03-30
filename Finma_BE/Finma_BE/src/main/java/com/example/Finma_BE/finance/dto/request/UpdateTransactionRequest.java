package com.example.Finma_BE.finance.dto.request;

import com.example.Finma_BE.enums.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateTransactionRequest {
    @NotNull
    private TransactionType type;

    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    private Long categoryId;

    @NotNull
    private Long accountId;

    private String note;
    private String imageUrl;
    private String location;

    @NotNull
    private String transactionDate;
}
