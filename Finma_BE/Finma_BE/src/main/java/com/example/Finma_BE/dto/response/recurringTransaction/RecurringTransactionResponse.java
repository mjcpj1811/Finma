package com.example.Finma_BE.dto.response.recurringTransaction;

import com.example.Finma_BE.enums.Frequency;
import com.example.Finma_BE.enums.RecurringStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class RecurringTransactionResponse {

    Long id;
    String title;
    BigDecimal amount;
    Frequency frequency;
    String frequencyLabel;
    LocalDate startDate;
    String executionLabel;
    Integer dayOfMonth;
    Integer dayOfWeek;
    Integer reminderDaysBefore;
    String note;
    Boolean isActive;
    RecurringStatus status;

    Long accountId;
    String accountName;
    Long categoryId;
    String categoryName;
    String categoryIcon;
    String categoryColor;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
