package com.example.Finma_BE.service.RecurringTransactionService;

import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionCreateRequest;
import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionToggleRequest;
import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionUpdateRequest;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionResponse;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionStatsResponse;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionSummaryResponse;
import com.example.Finma_BE.entity.Account;
import com.example.Finma_BE.entity.Category;
import com.example.Finma_BE.entity.RecurringTransaction;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.enums.Frequency;
import com.example.Finma_BE.enums.RecurringStatus;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.mapper.RecurringTransactionMapper;
import com.example.Finma_BE.repository.AccountRepository;
import com.example.Finma_BE.repository.CategoryRepository;
import com.example.Finma_BE.repository.RecurringTransactionRepository;
import com.example.Finma_BE.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class RecurringTransactionService {

    RecurringTransactionRepository recurringTransactionRepository;
    UserRepository userRepository;
    AccountRepository accountRepository;
    CategoryRepository categoryRepository;
    RecurringTransactionMapper  recurringTransactionMapper;

    @Transactional(readOnly = true)
    public RecurringTransactionStatsResponse getStats(Long userId) {
        int totalActive = recurringTransactionRepository.countByUserIdAndStatusAndIsActive(
                userId, RecurringStatus.ACTIVE, true);

        return RecurringTransactionStatsResponse.builder()
                .totalActive(totalActive)
                .totalMonthlyExpense(recurringTransactionRepository.sumMonthlyExpense(userId))
                .build();
    }

    @Transactional(readOnly = true)
    public List<RecurringTransactionSummaryResponse> getAll(Long userId, RecurringStatus status) {
        List<RecurringTransaction> list = (status != null)
                ? recurringTransactionRepository.findByUserIdAndStatus(userId, status)
                : recurringTransactionRepository.findAllActiveByUserId(userId);

        return recurringTransactionMapper.toSummaryList(list);
    }

    @Transactional(readOnly = true)
    public RecurringTransactionResponse getById(Long id, Long userId) {
        return recurringTransactionMapper.toResponse(findOfUser(id, userId));
    }

    @Transactional
    public RecurringTransactionResponse create(Long userId, RecurringTransactionCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        validateFrequency(request.getFrequency(), request.getDayOfMonth(), request.getDayOfWeek());

        Account account = resolveAccount(request.getAccountId(), userId);
        Category category = resolveCategory(request.getCategoryId(), userId);

        RecurringTransaction recurringTransaction =
                recurringTransactionMapper.toRecurringTransaction(request);

        recurringTransaction.setUser(user);
        recurringTransaction.setAccount(account);
        recurringTransaction.setCategory(category);
        recurringTransaction.setStatus(RecurringStatus.ACTIVE);
        recurringTransaction.setIsActive(true);

        return recurringTransactionMapper.toResponse(
                recurringTransactionRepository.save(recurringTransaction));
    }

    @Transactional
    public RecurringTransactionResponse update(Long id, Long userId,
                                               RecurringTransactionUpdateRequest request) {

        RecurringTransaction recurringTransaction = findOfUser(id, userId);

        recurringTransactionMapper
                .updateRecurringTransaction(recurringTransaction, request);

        Frequency frequency =
                request.getFrequency() != null
                        ? request.getFrequency()
                        : recurringTransaction.getFrequency();

        Integer dayOfMonth =
                request.getDayOfMonth() != null
                        ? request.getDayOfMonth()
                        : recurringTransaction.getDayOfMonth();

        Integer dayOfWeek =
                request.getDayOfWeek() != null
                        ? request.getDayOfWeek()
                        : recurringTransaction.getDayOfWeek();

        validateFrequency(frequency, dayOfMonth, dayOfWeek);

        if (request.getReminderDaysBefore() != null) {
            recurringTransaction.setReminderDaysBefore(request.getReminderDaysBefore());
        }

        if (request.getStatus() != null) {
            recurringTransaction.setStatus(request.getStatus());
            recurringTransaction.setIsActive(request.getStatus() == RecurringStatus.ACTIVE);
        }

        if (request.getAccountId() != null) {
            recurringTransaction.setAccount(
                    resolveAccount(request.getAccountId(), userId));
        }

        if (request.getCategoryId() != null) {
            recurringTransaction.setCategory(
                    resolveCategory(request.getCategoryId(), userId));
        }
        return recurringTransactionMapper.toResponse(
                recurringTransactionRepository.save(recurringTransaction));
    }

    @Transactional
    public RecurringTransactionResponse toggle(Long id, Long userId,
                                               RecurringTransactionToggleRequest request) {
        RecurringTransaction recurringTransaction= findOfUser(id, userId);

        if (recurringTransaction.getStatus() == RecurringStatus.CANCELLED) {
            throw new AppException(ErrorCode.RECURRING_ALREADY_CANCELLED);
        }

        if (request.getIsActive() == null) {
            throw new AppException(ErrorCode.INVALID_STATUS);
        }

        recurringTransaction.setIsActive(request.getIsActive());
        recurringTransaction.setStatus(request.getIsActive() ? RecurringStatus.ACTIVE : RecurringStatus.PAUSED);

        return recurringTransactionMapper.toResponse(
                recurringTransactionRepository.save(recurringTransaction));
    }

    @Transactional
    public void delete(Long id, Long userId) {
        RecurringTransaction recurringTransaction =
                findOfUser(id, userId);

        recurringTransaction.setStatus(RecurringStatus.CANCELLED);
        recurringTransaction.setIsActive(false);

        recurringTransactionRepository.save(recurringTransaction);
    }

    private RecurringTransaction findOfUser(Long id, Long userId) {
        return recurringTransactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.RECURRING_NOT_FOUND));
    }

    private void validateFrequency(
            Frequency frequency,
            Integer dayOfMonth,
            Integer dayOfWeek) {

        if (frequency == null) {
            throw new AppException(ErrorCode.INVALID_FREQUENCY);
        }
        switch (frequency) {
            case WEEKLY -> {
                if (dayOfWeek == null)
                    throw new AppException(
                            ErrorCode.INVALID_RECURRING_DAY_OF_WEEK);
            }
            case MONTHLY, YEARLY -> {
                if (dayOfMonth == null)
                    throw new AppException(
                            ErrorCode.INVALID_RECURRING_DAY_OF_MONTH);
            }
            default -> { }
        }
    }

    private Account resolveAccount(Long accountId, Long userId) {
        if (accountId == null) return null;
        return accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND));
    }

    private Category resolveCategory(Long categoryId, Long userId) {
        if (categoryId == null) return null;
        return categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
    }
}
