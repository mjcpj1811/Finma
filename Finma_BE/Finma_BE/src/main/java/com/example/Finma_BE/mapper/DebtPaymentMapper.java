package com.example.Finma_BE.mapper;

import com.example.Finma_BE.dto.request.debt.DebtPaymentCreateRequest;
import com.example.Finma_BE.dto.request.debt.DebtPaymentUpdateRequest;
import com.example.Finma_BE.dto.request.debt.DebtUpdateRequest;
import com.example.Finma_BE.dto.response.debt.DebtPaymentResponse;
import com.example.Finma_BE.entity.DebtPayment;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface DebtPaymentMapper {
    List<DebtPaymentResponse> toDebtPaymentResponseList(List<DebtPayment> debtPayments);
    DebtPayment toDebtPayment(DebtPaymentCreateRequest debtPaymentCreateRequest);
    DebtPaymentResponse toDebtPaymentResponse(DebtPayment debtPayment);
    void updateDebtPayment(@MappingTarget DebtPayment debtPayment, DebtPaymentUpdateRequest debtPaymentUpdateRequest);
}
