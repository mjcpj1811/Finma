package com.example.Finma_BE.dto.response.debt;

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
public class DebtPaymentResponse {
    Long id;
    BigDecimal amount;
    LocalDate paymentDate;
    LocalDateTime createdAt;
}
