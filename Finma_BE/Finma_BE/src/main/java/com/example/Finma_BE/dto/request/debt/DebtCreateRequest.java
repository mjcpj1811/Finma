package com.example.Finma_BE.dto.request.debt;

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
public class DebtCreateRequest {

    @NotBlank(message = "Tên người liên quan không được để trống")
    @Size(max = 255)
    String personName;

    @NotNull(message = "Loại không được để trống")
    DebtType type;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    BigDecimal totalAmount;

    @DecimalMin(value = "0", message = "Lãi suất không được âm")
    @DecimalMax(value = "100", message = "Lãi suất không hợp lệ")

    BigDecimal interestRate;
    LocalDate startDate;
    LocalDate dueDate;
    String note;
}
