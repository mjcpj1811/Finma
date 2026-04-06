package com.example.Finma_BE.dto.response;

import com.example.Finma_BE.enums.AccountType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AccountResponse {
    Long id;
    String name;
    AccountType type;
    BigDecimal balance;
    String icon;
    String color;
}
