package com.example.Finma_BE.dto.request;

import com.example.Finma_BE.enums.TransactionType;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Phần thân request để cập nhật giao dịch.
 *
 * <p>Shape này giống create để form thêm/sửa trên mobile có thể gửi cùng một
 * payload ở cả hai chế độ.</p>
 */
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
