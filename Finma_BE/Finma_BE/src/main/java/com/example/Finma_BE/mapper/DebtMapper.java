package com.example.Finma_BE.mapper;
import com.example.Finma_BE.dto.request.debt.DebtCreateRequest;
import com.example.Finma_BE.dto.request.debt.DebtUpdateRequest;
import com.example.Finma_BE.dto.response.debt.DebtResponse;
import com.example.Finma_BE.dto.response.debt.DebtSumaryResponse;
import com.example.Finma_BE.entity.Debt;
import org.mapstruct.*;

/**
 * Mapper cho doi tuong Debt.
 */
@Mapper(componentModel = "spring"
    , nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface DebtMapper {
    /**
     * Map entity sang response tong quan.
     */
    DebtSumaryResponse toDebtSumaryResponse(Debt debt);

    /**
     * Map entity sang response chi tiet.
     */
    DebtResponse toDebtResponse(Debt debt);

    /**
     * Map request tao moi sang entity.
     */
    Debt toDebt(DebtCreateRequest debtCreateRequest);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user",ignore = true)
    @Mapping(target = "payments", ignore = true)
    @Mapping(target = "status", ignore = true)
    /**
     * Cap nhat entity tu request.
     */
    void updateDebt(@MappingTarget Debt debt, DebtUpdateRequest debtUpdateRequest);
}
