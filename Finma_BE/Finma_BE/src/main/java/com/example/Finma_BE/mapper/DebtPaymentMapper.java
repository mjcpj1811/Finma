package com.example.Finma_BE.mapper;

import com.example.Finma_BE.dto.request.debt.DebtPaymentCreateRequest;
import com.example.Finma_BE.dto.request.debt.DebtPaymentUpdateRequest;
import com.example.Finma_BE.dto.response.debt.DebtPaymentResponse;
import com.example.Finma_BE.entity.DebtPayment;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring"
        , nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface DebtPaymentMapper {
    List<DebtPaymentResponse> toDebtPaymentResponseList(List<DebtPayment> debtPayments);

    DebtPayment toDebtPayment(DebtPaymentCreateRequest debtPaymentCreateRequest);

    DebtPaymentResponse toDebtPaymentResponse(DebtPayment debtPayment);


    @Mapping(target = "id", ignore = true)
    @Mapping(target = "debt", ignore = true)
    void updateDebtPayment(@MappingTarget DebtPayment debtPayment, DebtPaymentUpdateRequest debtPaymentUpdateRequest);
}
