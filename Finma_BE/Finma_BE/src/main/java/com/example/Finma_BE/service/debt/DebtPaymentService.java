package com.example.Finma_BE.service.debt;

import com.example.Finma_BE.dto.request.debt.DebtPaymentCreateRequest;
import com.example.Finma_BE.dto.request.debt.DebtPaymentUpdateRequest;
import com.example.Finma_BE.dto.response.debt.DebtPaymentResponse;
import com.example.Finma_BE.entity.Debt;
import com.example.Finma_BE.entity.DebtPayment;
import com.example.Finma_BE.enums.DebtStatus;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.mapper.DebtPaymentMapper;
import com.example.Finma_BE.repository.DebtPaymentRepository;
import com.example.Finma_BE.repository.DebtRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class DebtPaymentService {

    DebtPaymentRepository debtPaymentRepository;
    DebtPaymentMapper debtPaymentMapper;
    DebtRepository debtRepository;
    DebtCommonService debtCommonService;

    @Transactional(readOnly = true)
    public List<DebtPaymentResponse> getDebtPayments(
            Long debtId,
            Long userId) {

        Debt debt = debtCommonService.findDebtOfUser(debtId, userId);
        return debtPaymentMapper.toDebtPaymentResponseList(debt.getPayments());
    }

    @Transactional
    public DebtPaymentResponse createPayment(Long debtId, Long userId, DebtPaymentCreateRequest request) {
        Debt debt = debtCommonService.findDebtOfUser(debtId, userId);

        if (debt.getStatus() == DebtStatus.PAID) {
            throw new AppException(ErrorCode.DEBT_ALREADY_PAID);
        }

        BigDecimal alreadyPaid = debtPaymentRepository.sumPaidByDebtId(debtId);
        if (alreadyPaid == null) {
            alreadyPaid = BigDecimal.ZERO;
        }
        BigDecimal remaining = debt.getTotalAmount().subtract(alreadyPaid);

        if (request.getAmount().compareTo(remaining) > 0) {
            throw new AppException(ErrorCode.PAYMENT_AMOUNT_EXCEEDS_REMAINING);
        }

        BigDecimal newTotalPaid = alreadyPaid.add(request.getAmount());
        if (newTotalPaid.compareTo(debt.getTotalAmount()) == 0) {
            debt.setStatus(DebtStatus.PAID);
        }

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_PAYMENT_AMOUNT);
        }

        DebtPayment debtPayment = debtPaymentMapper.toDebtPayment(request);
        debtPayment.setDebt(debt);
        return debtPaymentMapper.toDebtPaymentResponse(debtPaymentRepository.save(debtPayment));

    }

    @Transactional
    public DebtPaymentResponse updatePayment(Long debtId, Long debtPaymentId, DebtPaymentUpdateRequest request, Long userId) {
        Debt debt = debtCommonService.findDebtOfUser(debtId, userId);

        DebtPayment payment = debtPaymentRepository.findByIdAndDebtId(debtPaymentId, debtId)
                        .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        BigDecimal totalPaid = debtPaymentRepository.sumPaidByDebtId(debtId);
        if (totalPaid == null) {
            totalPaid = BigDecimal.ZERO;
        }
        BigDecimal newTotalPaid = totalPaid
                        .subtract(payment.getAmount())
                        .add(request.getAmount());

        if (newTotalPaid.compareTo(debt.getTotalAmount()) > 0) {
            throw new AppException(
                    ErrorCode.PAYMENT_AMOUNT_EXCEEDS_REMAINING
            );
        }

        if (newTotalPaid.compareTo(debt.getTotalAmount()) == 0) {
            debt.setStatus(DebtStatus.PAID);
        } else {
            debt.setStatus(DebtStatus.ONGOING);
        }

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_PAYMENT_AMOUNT);
        }

        debtPaymentMapper.updateDebtPayment(payment,request);

        return debtPaymentMapper.toDebtPaymentResponse(debtPaymentRepository.save(payment));
    }

    @Transactional
    public void deletePayment(
            Long debtId,
            Long paymentId,
            Long userId) {

        Debt debt = debtCommonService.findDebtOfUser(debtId, userId);
        DebtPayment payment = debtPaymentRepository.findByIdAndDebtId(paymentId, debtId)
                        .orElseThrow(() ->new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        debtPaymentRepository.delete(payment);

        BigDecimal totalPaid =debtPaymentRepository.sumPaidByDebtId(debtId);

        if (totalPaid == null) {
            totalPaid = BigDecimal.ZERO;
        }

        if (totalPaid.compareTo(debt.getTotalAmount()) == 0) {
            debt.setStatus(DebtStatus.PAID);
        }
        else {
            debt.setStatus(DebtStatus.ONGOING);
        }
    }

}
