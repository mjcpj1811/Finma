package com.example.Finma_BE.dto.response.debt;

import com.example.Finma_BE.enums.DebtStatus;
import com.example.Finma_BE.enums.DebtType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class DebtSumaryResponse {

    Long id;
    DebtType type;
    String personName;
    BigDecimal totalAmount;
    BigDecimal paidAmount;
    BigDecimal remainingAmount;
    LocalDate dueDate;
    DebtStatus status;
    LocalDate startDate;
}
