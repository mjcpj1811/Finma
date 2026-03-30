package com.example.Finma_BE.finance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ReportChartResponse {
    private String view; // day|week|month|year
    private List<String> labels;
    private List<BigDecimal> income;
    private List<BigDecimal> expense;
    private ReportSummaryResponse summary;
}

