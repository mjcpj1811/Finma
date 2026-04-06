package com.example.Finma_BE.dto.request.debt;

import com.example.Finma_BE.enums.DebtStatus;
import com.example.Finma_BE.enums.DebtType;
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
public class DebtUpdateRequest {

    @NotBlank(message = "Tên không được để trống")
    @Size(max = 255)
    String personName;

    DebtType type;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01")
    BigDecimal totalAmount;

    @DecimalMin(value = "0")
    @DecimalMax(value = "100")
    BigDecimal interestRate;

    LocalDate startDate;
    LocalDate dueDate;
    String note;
    DebtStatus status;
}
