package com.example.Finma_BE.dto.response;

import com.example.Finma_BE.enums.PeriodType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BudgetResponse {

    Long id;

    // Thông tin category
    Long categoryId;
    String categoryName;
    String categoryIcon;
    String categoryColor;

    // Thông tin ngân sách
    BigDecimal amountLimit;
    PeriodType periodType;
    LocalDate startDate;
    LocalDate endDate;

    // Lặp tự động
    Boolean isRecurring;
    Long parentBudgetId;       // null nếu đây là budget gốc

    // Theo dõi chi tiêu
    BigDecimal spentAmount;        // Tổng đã chi tiêu trong kỳ
    BigDecimal remainingAmount;    // Số tiền còn lại
    Double usedPercentage;         // % đã sử dụng (0.0 - 100.0+)
    String status;                 // SAFE / WARNING / EXCEEDED

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
