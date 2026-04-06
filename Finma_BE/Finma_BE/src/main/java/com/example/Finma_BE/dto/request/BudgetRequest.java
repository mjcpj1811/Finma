package com.example.Finma_BE.dto.request;

import com.example.Finma_BE.enums.PeriodType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BudgetRequest {

    @NotNull(message = "Category ID is required")
    Long categoryId;

    @NotNull(message = "Amount limit is required")
    @Positive(message = "Amount limit must be positive")
    BigDecimal amountLimit;

    @NotNull(message = "Period type is required")
    PeriodType periodType;

    /**
     * Khi isRecurring = true:
     *   - startDate / endDate KHÔNG bắt buộc; service tự tính từ ngày 1 đến cuối tháng hiện tại.
     * Khi isRecurring = false:
     *   - startDate / endDate BẮT BUỘC phải nhập.
     */
    @Builder.Default
    Boolean isRecurring = false;

    LocalDate startDate;
    LocalDate endDate;
}
