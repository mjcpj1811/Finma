package com.example.Finma_BE.dto.response.recurringTransaction;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class RecurringTransactionStatsResponse {
    int totalActive;
    BigDecimal totalMonthlyExpense;
}
