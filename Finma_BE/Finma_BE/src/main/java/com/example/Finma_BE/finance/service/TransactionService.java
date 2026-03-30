package com.example.Finma_BE.finance.service;

import com.example.Finma_BE.entity.Account;
import com.example.Finma_BE.entity.Category;
import com.example.Finma_BE.entity.Transaction;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.enums.CategoryType;
import com.example.Finma_BE.enums.TransactionType;
import com.example.Finma_BE.finance.dto.request.CreateTransactionRequest;
import com.example.Finma_BE.finance.dto.request.UpdateTransactionRequest;
import com.example.Finma_BE.finance.dto.response.TransactionDetailResponse;
import com.example.Finma_BE.finance.dto.response.TransactionListItemResponse;
import com.example.Finma_BE.finance.exception.ApiException;
import com.example.Finma_BE.finance.repository.FinanceAccountRepository;
import com.example.Finma_BE.finance.repository.FinanceCategoryRepository;
import com.example.Finma_BE.finance.repository.FinanceTransactionRepository;
import com.example.Finma_BE.finance.util.DateTimeFormats;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final FinanceTransactionRepository transactionRepository;
    private final FinanceAccountRepository accountRepository;
    private final FinanceCategoryRepository categoryRepository;

    @Transactional
    public TransactionListItemResponse create(User user, CreateTransactionRequest request) {
        validateAmount(request.getAmount());
        Account account = loadAccountOwnedByUser(request.getAccountId(), user);
        Category category = loadCategoryOwnedByUser(request.getCategoryId(), user);
        validateCategoryMatchesTransactionType(request.getType(), category);

        LocalDateTime txnDate = parseTransactionDate(request.getTransactionDate());

        Transaction txn = Transaction.builder()
                .type(request.getType())
                .amount(request.getAmount())
                .note(request.getNote())
                .imageUrl(request.getImageUrl())
                .location(request.getLocation())
                .transactionDate(txnDate)
                .account(account)
                .category(category)
                .user(user)
                .build();

        applyBalanceEffect(account, request.getType(), request.getAmount(), true);
        return toListItem(transactionRepository.save(txn));
    }

    public TransactionDetailResponse getById(User user, Long id) {
        Transaction txn = loadTransactionOwnedByUser(id, user);
        return toDetail(txn);
    }

    @Transactional
    public TransactionDetailResponse update(User user, Long id, UpdateTransactionRequest request) {
        validateAmount(request.getAmount());
        Transaction txn = loadTransactionOwnedByUser(id, user);
        Account oldAccount = resolveAccountForBalance(txn.getAccount());
        TransactionType oldType = txn.getType();
        BigDecimal oldAmount = txn.getAmount();

        Account newAccount = loadAccountOwnedByUser(request.getAccountId(), user);
        Category category = loadCategoryOwnedByUser(request.getCategoryId(), user);
        validateCategoryMatchesTransactionType(request.getType(), category);
        LocalDateTime txnDate = parseTransactionDate(request.getTransactionDate());

        if (oldAccount != null) {
            applyBalanceEffect(oldAccount, oldType, oldAmount, false);
        }

        txn.setType(request.getType());
        txn.setAmount(request.getAmount());
        txn.setNote(request.getNote());
        txn.setImageUrl(request.getImageUrl());
        txn.setLocation(request.getLocation());
        txn.setTransactionDate(txnDate);
        txn.setAccount(newAccount);
        txn.setCategory(category);

        transactionRepository.save(txn);
        applyBalanceEffect(newAccount, request.getType(), request.getAmount(), true);
        return toDetail(txn);
    }

    @Transactional
    public void delete(User user, Long id) {
        Transaction txn = loadTransactionOwnedByUser(id, user);
        Account acc = resolveAccountForBalance(txn.getAccount());
        if (acc != null) {
            applyBalanceEffect(acc, txn.getType(), txn.getAmount(), false);
        }
        transactionRepository.delete(txn);
    }

    public List<TransactionListItemResponse> list(
            User user,
            TransactionType type,
            Long categoryId,
            Long accountId,
            String keyword,
            String from,
            String to
    ) {
        Specification<Transaction> spec = (root, query, cb) -> cb.equal(root.get("user"), user);

        if (type != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), type));
        }
        if (categoryId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId));
        }
        if (accountId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("account").get("id"), accountId));
        }
        if (keyword != null && !keyword.isBlank()) {
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.and(
                    cb.isNotNull(root.get("note")),
                    cb.like(cb.lower(root.get("note")), pattern)
            ));
        }

        LocalDateTime fromDt = null;
        LocalDateTime toDt = null;
        if (from != null && !from.isBlank()) {
            fromDt = parseDateBound(from, true);
        }
        if (to != null && !to.isBlank()) {
            toDt = parseDateBound(to, false);
        }
        if (fromDt != null) {
            LocalDateTime finalFromDt = fromDt;
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("transactionDate"), finalFromDt));
        }
        if (toDt != null) {
            LocalDateTime finalToDt = toDt;
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("transactionDate"), finalToDt));
        }

        return transactionRepository.findAll(spec).stream()
                .sorted((a, b) -> b.getTransactionDate().compareTo(a.getTransactionDate()))
                .map(this::toListItem)
                .toList();
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "amount must be > 0");
        }
    }

    /**
     * @param apply true = áp dụng giao dịch (tạo mới / sau khi sửa), false = hoàn tác (trước khi sửa / xóa)
     */
    private void applyBalanceEffect(Account account, TransactionType type, BigDecimal amount, boolean apply) {
        if (account == null || type == null || amount == null) {
            return;
        }
        BigDecimal delta = balanceDelta(type, amount, apply);
        BigDecimal current = account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO;
        BigDecimal next = current.add(delta);
        if (next.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "insufficient account balance");
        }
        account.setBalance(next);
        accountRepository.save(account);
    }

    private BigDecimal balanceDelta(TransactionType type, BigDecimal amount, boolean apply) {
        BigDecimal a = amount.abs();
        return switch (type) {
            case INCOME -> apply ? a : a.negate();
            case EXPENSE, SAVING -> apply ? a.negate() : a;
        };
    }

    private Account resolveAccountForBalance(Account ref) {
        if (ref == null || ref.getId() == null) {
            return null;
        }
        return accountRepository.findById(ref.getId()).orElse(null);
    }

    private Transaction loadTransactionOwnedByUser(Long id, User user) {
        Transaction txn = transactionRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "transaction not found"));
        if (txn.getUser() == null || !txn.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "transaction not accessible");
        }
        return txn;
    }

    private Account loadAccountOwnedByUser(Long accountId, User user) {
        if (accountId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "accountId is required");
        }
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "account not found"));
        if (account.getUser() == null || !account.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "account does not belong to user");
        }
        return account;
    }

    private Category loadCategoryOwnedByUser(Long categoryId, User user) {
        if (categoryId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "categoryId is required");
        }
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "category not found"));
        if (category.getUser() == null || !category.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "category does not belong to user");
        }
        return category;
    }

    private void validateCategoryMatchesTransactionType(TransactionType txnType, Category category) {
        CategoryType ct = category.getType();
        if (ct == null) {
            return;
        }
        switch (txnType) {
            case INCOME -> {
                if (ct != CategoryType.INCOME) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "category type must be INCOME for INCOME transaction");
                }
            }
            case EXPENSE -> {
                if (ct != CategoryType.EXPENSE) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "category type must be EXPENSE for EXPENSE transaction");
                }
            }
            case SAVING -> {
                if (ct == CategoryType.INCOME) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "category type cannot be INCOME for SAVING transaction");
                }
            }
        }
    }

    private LocalDateTime parseTransactionDate(String raw) {
        try {
            return LocalDateTime.parse(raw.trim(), DateTimeFormats.API_DATE_TIME);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "transactionDate invalid format (yyyy-MM-dd HH:mm:ss)");
        }
    }

    private LocalDateTime parseDateBound(String dateOrDateTime, boolean isStart) {
        try {
            if (dateOrDateTime.trim().length() == 10) {
                LocalDate d = LocalDate.parse(dateOrDateTime.trim());
                return isStart ? d.atStartOfDay() : d.atTime(23, 59, 59);
            }
            return LocalDateTime.parse(dateOrDateTime.trim(), DateTimeFormats.API_DATE_TIME);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid date format. Use yyyy-MM-dd or yyyy-MM-dd HH:mm:ss");
        }
    }

    private TransactionListItemResponse toListItem(Transaction txn) {
        return TransactionListItemResponse.builder()
                .id(txn.getId())
                .type(txn.getType())
                .amount(txn.getAmount())
                .categoryId(txn.getCategory() != null ? txn.getCategory().getId() : null)
                .category(txn.getCategory() != null ? txn.getCategory().getName() : null)
                .accountId(txn.getAccount() != null ? txn.getAccount().getId() : null)
                .account(txn.getAccount() != null ? txn.getAccount().getName() : null)
                .note(txn.getNote())
                .date(txn.getTransactionDate() != null ? txn.getTransactionDate().toLocalDate().format(DateTimeFormats.API_DATE) : null)
                .transactionDateTime(txn.getTransactionDate() != null ? txn.getTransactionDate().format(DateTimeFormats.API_DATE_TIME) : null)
                .build();
    }

    private TransactionDetailResponse toDetail(Transaction txn) {
        return TransactionDetailResponse.builder()
                .id(txn.getId())
                .type(txn.getType())
                .amount(txn.getAmount())
                .categoryId(txn.getCategory() != null ? txn.getCategory().getId() : null)
                .categoryName(txn.getCategory() != null ? txn.getCategory().getName() : null)
                .accountId(txn.getAccount() != null ? txn.getAccount().getId() : null)
                .accountName(txn.getAccount() != null ? txn.getAccount().getName() : null)
                .note(txn.getNote())
                .imageUrl(txn.getImageUrl())
                .location(txn.getLocation())
                .transactionDate(txn.getTransactionDate() != null ? txn.getTransactionDate().format(DateTimeFormats.API_DATE_TIME) : null)
                .build();
    }
}
