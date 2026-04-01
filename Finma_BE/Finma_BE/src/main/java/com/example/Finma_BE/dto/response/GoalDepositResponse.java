package com.example.Finma_BE.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GoalDepositResponse {

    Long id;
    Long goalId;
    String goalName;

    BigDecimal amount;
    LocalDate depositDate;
    String note;

    // Snapshot tiến độ tại thời điểm nạp
    BigDecimal goalCurrentAmount;   // Tổng đã tiết kiệm sau lần nạp này
    BigDecimal goalTargetAmount;
    Double progressPercentage;

    LocalDateTime createdAt;
}
