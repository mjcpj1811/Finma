package com.example.Finma_BE.finance.dto.response;

import com.example.Finma_BE.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TransactionDetailResponse {
    private Long id;
    private TransactionType type;
    private BigDecimal amount;
    private Long categoryId;
    private String categoryName;
    private Long accountId;
    private String accountName;
    private String note;
    private String imageUrl;
    private String location;
    /** yyyy-MM-dd HH:mm:ss */
    private String transactionDate;
}
