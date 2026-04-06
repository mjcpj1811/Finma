package com.example.Finma_BE.dto.request;

import com.example.Finma_BE.enums.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AccountRequest {
    @NotBlank
    String name;

    @NotNull
    AccountType type;

    @NotNull
    BigDecimal balance;

    String icon;
    String color;
}
