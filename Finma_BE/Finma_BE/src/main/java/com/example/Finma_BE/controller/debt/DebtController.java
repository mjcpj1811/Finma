package com.example.Finma_BE.controller.debt;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.request.debt.DebtCreateRequest;
import com.example.Finma_BE.dto.request.debt.DebtUpdateRequest;
import com.example.Finma_BE.dto.response.debt.DebtResponse;
import com.example.Finma_BE.dto.response.debt.DebtStatsResponse;
import com.example.Finma_BE.dto.response.debt.DebtSumaryResponse;
import com.example.Finma_BE.enums.DebtType;
import com.example.Finma_BE.service.debt.DebtService;
import com.example.Finma_BE.util.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/debts")
public class DebtController {

   DebtService debtService;

    @GetMapping("/stats")
    ApiResponse<DebtStatsResponse> getStats(){
        Long userId = SecurityUtils.getCurrentUserId();

        return ApiResponse.<DebtStatsResponse>builder()
                .result(debtService.getStats(userId))
                .build();
    }

    @GetMapping
    ApiResponse<List<DebtSumaryResponse>> getAllDebts(@RequestParam(required = false) DebtType type){
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<List<DebtSumaryResponse>>builder()
                .result(debtService.getAllDebt(userId,type))
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<DebtResponse> getDebtById(@PathVariable Long id){
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<DebtResponse>builder()
                .result(debtService.getDebtById(id,userId))
                .build();
    }

    @PostMapping
    ApiResponse<DebtResponse> createDebt(@Valid @RequestBody DebtCreateRequest request){
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<DebtResponse>builder()
                .result(debtService.createDebt(userId, request))
                .build();
    }

    @PutMapping("/{id}")
    ApiResponse<DebtResponse> updateDebtById(@PathVariable Long id, @Valid @RequestBody DebtUpdateRequest request){
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.<DebtResponse>builder()
                .result(debtService.updateDebt(userId, id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    ApiResponse<Void> deleteDebt(@PathVariable Long id){
        Long userId = SecurityUtils.getCurrentUserId();
        debtService.deleteDebt(id, userId);
        return ApiResponse.<Void>builder()
                .message("Debt deleted successfully")
                .build();
    }
}
