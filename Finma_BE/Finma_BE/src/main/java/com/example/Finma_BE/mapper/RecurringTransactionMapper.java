package com.example.Finma_BE.mapper;

import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionCreateRequest;
import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionUpdateRequest;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionResponse;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionSummaryResponse;
import com.example.Finma_BE.entity.RecurringTransaction;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RecurringTransactionMapper {
    RecurringTransactionResponse toResponse(RecurringTransaction recurringTransaction);

    List<RecurringTransactionSummaryResponse> toSummaryList(List<RecurringTransaction> list);

    @Mapping(
            target = "reminderDaysBefore",
            defaultValue = "1"
    )
    RecurringTransaction toRecurringTransaction(
            RecurringTransactionCreateRequest recurringTransactionCreateRequest);

    @BeanMapping(
            nullValuePropertyMappingStrategy =
                    NullValuePropertyMappingStrategy.IGNORE
    )
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "account", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    void updateRecurringTransaction(@MappingTarget RecurringTransaction recurringTransaction
            , RecurringTransactionUpdateRequest recurringTransactionUpdateRequest);

}
