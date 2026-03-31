package com.example.Finma_BE.dto.response.debt;

import com.example.Finma_BE.enums.DebtStatus;
import com.example.Finma_BE.enums.DebtType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class DebtResponse {
    Long id;
    DebtType type;
    String personName;
    BigDecimal totalAmount;
    BigDecimal paidAmount;       // tổng đã trả
    BigDecimal remainingAmount;  // còn lại
    BigDecimal interestRate;
    LocalDate startDate;
    LocalDate dueDate;
    String note;
    DebtStatus status;
    List<DebtPaymentResponse> payments;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
