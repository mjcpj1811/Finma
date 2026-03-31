package com.example.Finma_BE.mapper;
import com.example.Finma_BE.dto.request.debt.DebtCreateRequest;
import com.example.Finma_BE.dto.request.debt.DebtUpdateRequest;
import com.example.Finma_BE.dto.response.debt.DebtResponse;
import com.example.Finma_BE.dto.response.debt.DebtSumaryResponse;
import com.example.Finma_BE.entity.Debt;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface DebtMapper {
    DebtSumaryResponse toDebtSumaryResponse(Debt debt);

    DebtResponse toDebtResponse(Debt debt);

    Debt toDebt(DebtCreateRequest debtCreateRequest);

    @BeanMapping(
            nullValuePropertyMappingStrategy =
                    NullValuePropertyMappingStrategy.IGNORE
    )
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user",ignore = true)
    @Mapping(target = "payments", ignore = true)
    @Mapping(target = "status", ignore = true)
    void updateDebt(@MappingTarget Debt debt, DebtUpdateRequest debtUpdateRequest);
}
