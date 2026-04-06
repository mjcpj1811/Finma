package com.example.Finma_BE.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GoalRequest {

    @NotBlank(message = "Goal name is required")
    String name;

    String description;

    @NotNull(message = "Target amount is required")
    @Positive(message = "Target amount must be positive")
    BigDecimal targetAmount;

    @NotNull(message = "Start date is required")
    LocalDate startDate;

    @NotNull(message = "End date is required")
    @Future(message = "End date must be in the future")
    LocalDate endDate;

    String icon;
    String color;
}
