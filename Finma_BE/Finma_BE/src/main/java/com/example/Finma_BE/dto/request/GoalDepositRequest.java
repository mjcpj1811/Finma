package com.example.Finma_BE.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    /** Tài khoản lấy tiền ra (bắt buộc để trừ số dư khả dụng) */
    @NotNull(message = "Account ID is required")
    Long accountId;

    /** Nếu không truyền sẽ dùng ngày hiện tại */
    LocalDateTime depositDate;

    /** DEPOSIT hoặc WITHDRAW, mặc định DEPOSIT nếu bỏ trống */
    String kind;

    String note;
}
