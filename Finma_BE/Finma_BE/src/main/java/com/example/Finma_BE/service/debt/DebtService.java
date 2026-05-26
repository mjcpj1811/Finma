package com.example.Finma_BE.service.debt;



import com.example.Finma_BE.dto.request.debt.DebtCreateRequest;
import com.example.Finma_BE.dto.request.debt.DebtUpdateRequest;
import com.example.Finma_BE.dto.response.debt.DebtResponse;
import com.example.Finma_BE.dto.response.debt.DebtStatsResponse;
import com.example.Finma_BE.dto.response.debt.DebtSumaryResponse;
import com.example.Finma_BE.entity.Debt;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.enums.DebtStatus;
import com.example.Finma_BE.enums.DebtType;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.mapper.DebtMapper;
import com.example.Finma_BE.repository.DebtPaymentRepository;
import com.example.Finma_BE.repository.DebtRepository;
import com.example.Finma_BE.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Dich vu quan ly khoan vay/no.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class DebtService {

    DebtRepository debtRepository;
    DebtPaymentRepository debtPaymentRepository;
    UserRepository userRepository;
    DebtMapper debtMapper;
    DebtCommonService debtCommonService;

    /**
     * Thong ke tong tien vay/cho vay va so luong khoan dang hoat dong.
     */
    @Transactional(readOnly = true)
    public DebtStatsResponse getStats(Long userId){
        BigDecimal totalLend = safeAmount(debtRepository.sumActiveLend(userId));
        BigDecimal totalLoan = safeAmount(debtRepository.sumActiveLoan(userId));
        return DebtStatsResponse.builder()
                .totalLend(totalLend)
                .totalLoan(totalLoan)
                .lendCount(debtRepository.countByUserIdAndTypeAndStatus(
                        userId, DebtType.LEND,
                        DebtStatus.ONGOING
                        )
                )
                .loanCount(debtRepository.countByUserIdAndTypeAndStatus(
                        userId, DebtType.LOAN,
                        DebtStatus.ONGOING
                        )
                )
                .build();
    }

    /**
     * Lay danh sach khoan no theo type neu co, kem thong tin thanh toan.
     */
    @Transactional(readOnly = true)
    public List<DebtSumaryResponse> getAllDebt(Long userId, DebtType type){
        List<Debt> debts = (type != null)
                ? debtRepository.findByUserIdAndTypeWithPayments(userId, type)
                : debtRepository.findAllByUserIdWithPayments(userId);
        return debts.stream()
                .map(debtMapper::toDebtSumaryResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lay chi tiet khoan no theo id.
     */
    @Transactional(readOnly = true)
    public DebtResponse getDebtById(Long id, Long userId){
        Debt debt = debtCommonService.findDebtOfUser(id, userId);
        return debtMapper.toDebtResponse(debt);
    }

    /**
     * Tao khoan no moi.
     */
    @Transactional
    public DebtResponse createDebt(Long userId, DebtCreateRequest request){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        validateDateRange(request.getStartDate(), request.getDueDate());
        Debt debt = debtMapper.toDebt(request);
        debt.setUser(user);
        return  debtMapper.toDebtResponse(debtRepository.save(debt));
    }

    /**
     * Lay danh sach khoan no dang hoat dong theo user.
     */
    @Transactional(readOnly = true)
    public List<Debt> getActiveDebtsByUserId(Long userId) {
        return debtRepository.findAllByUserIdAndStatus(userId, DebtStatus.ONGOING);
    }

    /**
     * Cap nhat khoan no va kiem tra rang buoc trang thai/thanh toan.
     */
    @Transactional
    public DebtResponse updateDebt(Long userId, Long id, DebtUpdateRequest request){
        Debt debt = debtCommonService.findDebtOfUser(id, userId);

        validateDateRange(request.getStartDate(), request.getDueDate());

        if (debt.getStatus() == DebtStatus.PAID
                && request.getStatus() != null
                && request.getStatus() != DebtStatus.PAID) {

            throw new AppException(ErrorCode.CANNOT_REOPEN_PAID_DEBT);
        }

        if (request.getStatus() == DebtStatus.PAID) {
            BigDecimal paid = safeAmount(debtPaymentRepository.sumPaidByDebtId(id));
            if (paid.compareTo(debt.getTotalAmount()) < 0) {
                throw new AppException(ErrorCode.CANNOT_MARK_AS_PAID_WITH_REMAINING_AMOUNT);
            }
        }

        debtMapper.updateDebt(debt,request);
        return debtMapper.toDebtResponse(debtRepository.save(debt));

    }

    /**
     * Xoa khoan no.
     */
    @Transactional
    public void deleteDebt(Long id, Long userId) {
        Debt debt = debtCommonService.findDebtOfUser(id, userId);
        debtRepository.delete(debt);
    }

    /**
     * Kiem tra ngay den han khong truoc ngay bat dau.
     */
    private void validateDateRange(LocalDate startDate, LocalDate dueDate) {
        if (startDate != null && dueDate != null && dueDate.isBefore(startDate)) {
            throw new AppException(ErrorCode.RETURN_DATE_MUST_BE_AFTER_START_DATE);
        }
    }

    /**
     * Dam bao gia tri khong null.
     */
    private BigDecimal safeAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
