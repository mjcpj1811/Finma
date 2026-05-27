package com.example.Finma_BE.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Dữ liệu trả về của biểu đồ thu nhập/chi tiêu.
 *
 * <p>`labels`, `income` và `expense` là các mảng song song: cùng một index
 * biểu diễn cùng một bucket ngày/tuần/tháng/năm.</p>
 */
@Data
@Builder
public class ReportChartResponse {
    private String view; // day|week|month|year
    private List<String> labels;
    private List<BigDecimal> income;
    private List<BigDecimal> expense;
    private ReportSummaryResponse summary;
}
