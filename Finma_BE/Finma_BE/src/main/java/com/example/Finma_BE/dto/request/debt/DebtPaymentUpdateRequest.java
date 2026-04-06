package com.example.Finma_BE.dto.request.debt;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class DebtPaymentUpdateRequest {

    @NotNull(message = "Số tiền thanh toán không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    BigDecimal amount;

    @NotNull(message = "Ngày thanh toán không được để trống")
    LocalDate paymentDate;
}
