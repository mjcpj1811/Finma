package com.example.Finma_BE.dto.response.debt;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class DebtStatsResponse {
    BigDecimal totalLend;   // Cho vay (tổng)
    BigDecimal totalLoan;   // Đang vay (tổng)
    int lendCount;
    int loanCount;
}
