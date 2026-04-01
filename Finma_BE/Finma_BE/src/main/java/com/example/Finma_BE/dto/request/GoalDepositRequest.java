package com.example.Finma_BE.dto.request;

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
public class GoalDepositRequest {

    @NotNull(message = "Goal ID is required")
    Long goalId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    BigDecimal amount;

    /** Tài khoản lấy tiền ra (tuỳ chọn) */
    Long accountId;

    /** Nếu không truyền sẽ dùng ngày hiện tại */
    LocalDate depositDate;

    String note;
}

