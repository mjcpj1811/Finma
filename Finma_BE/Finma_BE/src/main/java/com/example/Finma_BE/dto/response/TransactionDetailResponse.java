package com.example.Finma_BE.dto.response;

import com.example.Finma_BE.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Payload giao dịch đầy đủ dùng cho màn hình chi tiết và nạp dữ liệu chế độ sửa.
 */
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
    /** yyyy-MM-dd HH:mm:ss */
    private String createdAt;
}
