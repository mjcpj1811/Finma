package com.example.Finma_BE.dto.response;

import com.example.Finma_BE.enums.TransactionType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TransactionResponse {
    Long id;
    TransactionType type;
    BigDecimal amount;
    String note;
    String imageUrl;
    String location;
    LocalDateTime transactionDate;
    LocalDateTime createdAt;
    String category;
}
