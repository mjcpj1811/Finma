package com.example.Finma_BE.mapper;

import com.example.Finma_BE.dto.request.debt.DebtPaymentCreateRequest;
import com.example.Finma_BE.dto.request.debt.DebtPaymentUpdateRequest;
import com.example.Finma_BE.dto.response.debt.DebtPaymentResponse;
import com.example.Finma_BE.entity.DebtPayment;
import org.mapstruct.*;

import java.util.List;

/**
 * Mapper cho doi tuong thanh toan no.
 */
@Mapper(componentModel = "spring"
    , nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface DebtPaymentMapper {
    List<DebtPaymentResponse> toDebtPaymentResponseList(List<DebtPayment> debtPayments);

    /**
     * Map request tao moi thanh toan sang entity.
     */
    DebtPayment toDebtPayment(DebtPaymentCreateRequest debtPaymentCreateRequest);

    /**
     * Map entity sang response.
     */
    DebtPaymentResponse toDebtPaymentResponse(DebtPayment debtPayment);


    /**
     * Cap nhat entity tu request.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "debt", ignore = true)
    void updateDebtPayment(@MappingTarget DebtPayment debtPayment, DebtPaymentUpdateRequest debtPaymentUpdateRequest);
}
