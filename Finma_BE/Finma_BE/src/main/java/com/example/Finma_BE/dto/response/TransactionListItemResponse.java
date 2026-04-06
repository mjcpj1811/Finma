package com.example.Finma_BE.dto.response;

import com.example.Finma_BE.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TransactionListItemResponse {
    private Long id;
    private TransactionType type;
    private BigDecimal amount;
    private Long categoryId;
    private String category;
    private Long accountId;
    private String account;
    private String note;
    // Format: yyyy-MM-dd
    private String date;
    /** yyyy-MM-dd HH:mm:ss */
    private String transactionDateTime;
}
