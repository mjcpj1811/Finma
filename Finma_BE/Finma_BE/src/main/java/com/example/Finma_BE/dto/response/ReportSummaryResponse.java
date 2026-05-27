package com.example.Finma_BE.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Các tổng số liệu cho khoảng lọc báo cáo.
 */
@Data
@Builder
public class ReportSummaryResponse {
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
}
