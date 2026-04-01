package com.example.Finma_BE.dto.request.recurringTransaction;

import com.example.Finma_BE.enums.Frequency;
import com.example.Finma_BE.enums.RecurringStatus;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class RecurringTransactionUpdateRequest {
    @NotNull
    Frequency frequency;

    @NotNull
    LocalDate startDate;

    @NotBlank
    @Size(max = 255)
    String title;

    @NotNull
    @DecimalMin(value = "0.01")
    BigDecimal amount;

    String note;
    Long accountId;
    Long categoryId;

    @Min(1) @Max(31)
    Integer dayOfMonth;

    @Min(0) @Max(6)
    Integer dayOfWeek;

    @Min(0)
    Integer reminderDaysBefore;

    // Cho phép PAUSE / CANCEL từ client
    RecurringStatus status;
}
