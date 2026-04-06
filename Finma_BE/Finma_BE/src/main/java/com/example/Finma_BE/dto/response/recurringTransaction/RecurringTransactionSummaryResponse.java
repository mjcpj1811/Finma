package com.example.Finma_BE.dto.response.recurringTransaction;

import com.example.Finma_BE.enums.RecurringStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class RecurringTransactionSummaryResponse {

    Long id;
    String title;
    BigDecimal amount;
    String frequencyLabel;
    String executionLabel;
    String categoryIcon;
    String categoryColor;
    Boolean isActive;
    RecurringStatus status;
}
