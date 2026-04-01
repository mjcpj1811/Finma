package com.example.Finma_BE.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ReportPieItemResponse {
    private String category;
    private BigDecimal amount;
}
