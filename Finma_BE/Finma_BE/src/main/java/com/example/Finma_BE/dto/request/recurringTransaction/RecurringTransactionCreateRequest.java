package com.example.Finma_BE.dto.request.recurringTransaction;

import com.example.Finma_BE.enums.Frequency;
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
public class RecurringTransactionCreateRequest {
    @NotNull(message = "Chu kỳ không được để trống")
    Frequency frequency;

    @NotNull(message = "Ngày thực hiện không được để trống")
    LocalDate startDate;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255)
    String title;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    BigDecimal amount;

    String note;

    Long accountId;
    Long categoryId;

    // Bắt buộc nếu MONTHLY | YEARLY
    @Min(1) @Max(31)
    Integer dayOfMonth;

    // Bắt buộc nếu WEEKLY (0=CN, 1=T2 ... 6=T7)
    @Min(0) @Max(6)
    Integer dayOfWeek;

    @Min(0)
    Integer reminderDaysBefore = 1;
}
