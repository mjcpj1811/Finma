package com.example.Finma_BE.dto.request;

import com.example.Finma_BE.enums.TransactionType;
import com.fasterxml.jackson.annotation.JsonAlias;
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

    private Long accountId;
    @JsonAlias("sourceId")
    private String sourceId;

    private String note;
    @JsonAlias("detail")
    private String detail;
    @JsonAlias("title")
    private String title;
    private String imageUrl;
    private String location;

    private String transactionDate;
    @JsonAlias("date")
    private String date;
}
