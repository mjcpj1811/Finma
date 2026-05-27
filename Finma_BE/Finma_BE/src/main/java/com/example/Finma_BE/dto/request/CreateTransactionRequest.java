package com.example.Finma_BE.dto.request;

import com.example.Finma_BE.enums.TransactionType;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Phần thân request để tạo giao dịch.
 *
 * <p>`sourceId`, `detail`, `title` và `date` được chấp nhận như alias từ
 * mobile client để backend giữ một luồng tạo cho cả payload cũ và mới.</p>
 */
@Data
public class CreateTransactionRequest {
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

    // Định dạng: yyyy-MM-dd HH:mm:ss (Asia/Ho_Chi_Minh)
    private String transactionDate;
    @JsonAlias("date")
    private String date;
}
