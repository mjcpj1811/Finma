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

/**
 * Dich vu quan ly cac lan thanh toan cua khoan no.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class DebtPaymentService {

    DebtPaymentRepository debtPaymentRepository;
    DebtPaymentMapper debtPaymentMapper;
    DebtRepository debtRepository;
    DebtCommonService debtCommonService;

    /**
     * Lay danh sach thanh toan theo khoan no.
     */
    @Transactional(readOnly = true)
    public List<DebtPaymentResponse> getDebtPayments(
            Long debtId,
            Long userId) {

        debtCommonService.findDebtOfUser(debtId, userId);
        return debtPaymentMapper.toDebtPaymentResponseList(
                debtPaymentRepository.findByDebtIdOrderByPaymentDateDesc(debtId));
    }

    /**
     * Tao moi mot lan thanh toan.
     */
    @Transactional
    public DebtPaymentResponse createPayment(Long debtId, Long userId, DebtPaymentCreateRequest request) {
        Debt debt = debtCommonService.findDebtOfUser(debtId, userId);

        validatePositiveAmount(request.getAmount());

        if (debt.getStatus() == DebtStatus.PAID) {
            throw new AppException(ErrorCode.DEBT_ALREADY_PAID);
        }

        BigDecimal alreadyPaid = safeAmount(debtPaymentRepository.sumPaidByDebtId(debtId));
        BigDecimal remaining = debt.getTotalAmount().subtract(alreadyPaid);

        if (request.getAmount().compareTo(remaining) > 0) {
            throw new AppException(ErrorCode.PAYMENT_AMOUNT_EXCEEDS_REMAINING);
        }

        BigDecimal newTotalPaid = alreadyPaid.add(request.getAmount());
        if (newTotalPaid.compareTo(debt.getTotalAmount()) == 0) {
            debt.setStatus(DebtStatus.PAID);
        }

        DebtPayment debtPayment = debtPaymentMapper.toDebtPayment(request);
        debtPayment.setDebt(debt);
        return debtPaymentMapper.toDebtPaymentResponse(debtPaymentRepository.save(debtPayment));

    }

    /**
     * Cap nhat thong tin thanh toan.
     */
    @Transactional
    public DebtPaymentResponse updatePayment(Long debtId, Long debtPaymentId, DebtPaymentUpdateRequest request, Long userId) {
        Debt debt = debtCommonService.findDebtOfUser(debtId, userId);

        validatePositiveAmount(request.getAmount());

        DebtPayment payment = debtPaymentRepository.findByIdAndDebtId(debtPaymentId, debtId)
                        .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        BigDecimal totalPaid = safeAmount(debtPaymentRepository.sumPaidByDebtId(debtId));
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

        debtPaymentMapper.updateDebtPayment(payment,request);

        return debtPaymentMapper.toDebtPaymentResponse(debtPaymentRepository.save(payment));
    }

    /**
     * Xoa thanh toan va cap nhat trang thai khoan no.
     */
    @Transactional
    public void deletePayment(
            Long debtId,
            Long paymentId,
            Long userId) {

        Debt debt = debtCommonService.findDebtOfUser(debtId, userId);
        DebtPayment payment = debtPaymentRepository.findByIdAndDebtId(paymentId, debtId)
                        .orElseThrow(() ->new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        debtPaymentRepository.delete(payment);

        BigDecimal totalPaid = safeAmount(debtPaymentRepository.sumPaidByDebtId(debtId));

        if (totalPaid.compareTo(debt.getTotalAmount()) == 0) {
            debt.setStatus(DebtStatus.PAID);
        }
        else {
            debt.setStatus(DebtStatus.ONGOING);
        }
    }

    /**
     * Dam bao gia tri khong null.
     */
    private BigDecimal safeAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    /**
     * Kiem tra so tien hop le (> 0).
     */
    private void validatePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_PAYMENT_AMOUNT);
        }
    }

}
