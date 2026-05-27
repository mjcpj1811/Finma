package com.example.Finma_BE.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Số tiền chi tiêu được nhóm theo danh mục cho view phân bổ chi tiêu.
 */
@Data
@Builder
public class ReportPieItemResponse {
    private String category;
    private BigDecimal amount;
}
