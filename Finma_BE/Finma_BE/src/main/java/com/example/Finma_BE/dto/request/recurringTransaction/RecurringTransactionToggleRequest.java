package com.example.Finma_BE.dto.request.recurringTransaction;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class RecurringTransactionToggleRequest {
    @NotNull
    Boolean isActive;
}
