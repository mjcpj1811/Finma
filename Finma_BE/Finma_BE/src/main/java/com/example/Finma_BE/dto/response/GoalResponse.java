package com.example.Finma_BE.dto.response;

import com.example.Finma_BE.enums.GoalStatus;
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
public class GoalResponse {

    Long id;
    String name;
    String description;
    String icon;
    String color;

    // Mục tiêu
    BigDecimal targetAmount;
    BigDecimal currentAmount;       // Đã tiết kiệm được
    BigDecimal remainingAmount;     // Còn cần tiết kiệm
    Double progressPercentage;      // % tiến độ (0.0 - 100.0)
    GoalStatus status;

    // Thời gian
    LocalDate startDate;
    LocalDate endDate;
    LocalDate completedAt;
    Long daysRemaining;             // Số ngày còn lại đến deadline

    // Tính toán tiết kiệm cần thiết
    BigDecimal dailySavingNeeded;   // Cần tiết kiệm bao nhiêu/ngày
    BigDecimal monthlySavingNeeded; // Cần tiết kiệm bao nhiêu/tháng

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
