package com.example.Finma_BE.service;
import com.example.Finma_BE.dto.request.CreateTransactionRequest;
import com.example.Finma_BE.dto.request.UpdateTransactionRequest;
import com.example.Finma_BE.dto.response.TransactionDetailResponse;
import com.example.Finma_BE.dto.response.TransactionListItemResponse;
import com.example.Finma_BE.entity.Account;
import com.example.Finma_BE.entity.Category;
import com.example.Finma_BE.entity.Transaction;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.enums.CategoryType;
import com.example.Finma_BE.enums.TransactionType;
import com.example.Finma_BE.exception.ApiException;
import com.example.Finma_BE.entity.Goal;
import com.example.Finma_BE.enums.GoalStatus;
import com.example.Finma_BE.repository.AccountRepository;
import com.example.Finma_BE.repository.CategoryRepository;
import com.example.Finma_BE.repository.GoalRepository;
import com.example.Finma_BE.repository.TransactionRepository;
import com.example.Finma_BE.util.DateTimeFormats;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final GoalRepository goalRepository;

    /**
     * Tạo giao dịch cho một user và áp dụng tác động lên số dư.
     *
     * <p>Các rule quan trọng được đặt ở service thay vì controller: amount phải
     * dương, account/category phải thuộc user và category type phải khớp với
     * transaction type.</p>
     */
    @Transactional
    @SuppressWarnings("null")
    public Transaction create(User user, CreateTransactionRequest request) {
        validateAmount(request.getAmount());
        Account account = loadAccountOwnedByUser(resolveAccountId(request.getAccountId(), request.getSourceId()), user);
        Category category = loadCategoryOwnedByUser(request.getCategoryId(), user);
        validateCategoryMatchesTransactionType(request.getType(), category);

        LocalDateTime txnDate = parseTransactionDate(resolveTransactionDate(request.getTransactionDate(), request.getDate()));

        Transaction txn = Transaction.builder()
                .type(request.getType())
                .amount(request.getAmount())
                .note(resolveNote(request.getNote(), request.getDetail(), request.getTitle()))
                .icon(request.getImageUrl())
                .location(request.getLocation())
                .transactionDate(txnDate)
                .account(account)
                .category(category)
                .user(user)
                .build();

        applyBalanceEffect(account, request.getType(), request.getAmount(), true);
        return Objects.requireNonNull(transactionRepository.save(txn));
    }

    /**
     * Trả về các entity giao dịch mới nhất để tổng hợp dashboard nội bộ.
     */
    public List<Transaction> getRecentTransactionsByUserId(Long userId, int limit) {
        return transactionRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream().limit(limit).collect(Collectors.toList());
    }

    /**
     * Tải chi tiết giao dịch sau khi kiểm tra quyền sở hữu của user.
     */
    public TransactionDetailResponse getById(User user, Long id) {
        Transaction txn = loadTransactionOwnedByUser(id, user);
        return toDetail(txn);
    }

    /**
     * Cập nhật giao dịch mà vẫn giữ nhất quán số dư tài khoản.
     *
     * <p>Hệ thống hoàn tác tác động của giao dịch cũ trước, sau đó lưu trạng thái
     * mới và áp dụng tác động mới. Cách này giúp chỉnh sửa account, type, amount,
     * category hoặc date vẫn an toàn.</p>
     */
    @Transactional
    public Transaction update(User user, Long id, UpdateTransactionRequest request) {
        validateAmount(request.getAmount());
        Transaction txn = loadTransactionOwnedByUser(id, user);
        Account oldAccount = resolveAccountForBalance(txn.getAccount());
        TransactionType oldType = txn.getType();
        BigDecimal oldAmount = txn.getAmount();

        Account newAccount = loadAccountOwnedByUser(resolveAccountId(request.getAccountId(), request.getSourceId()), user);
        Category category = loadCategoryOwnedByUser(request.getCategoryId(), user);
        validateCategoryMatchesTransactionType(request.getType(), category);
        LocalDateTime txnDate = parseTransactionDate(resolveTransactionDate(request.getTransactionDate(), request.getDate()));

        if (oldAccount != null) {
            applyBalanceEffect(oldAccount, oldType, oldAmount, false);
        }

        txn.setType(request.getType());
        txn.setAmount(request.getAmount());
        txn.setNote(resolveNote(request.getNote(), request.getDetail(), request.getTitle()));
        txn.setIcon(request.getImageUrl());
        txn.setLocation(request.getLocation());
        txn.setTransactionDate(txnDate);
        txn.setAccount(newAccount);
        txn.setCategory(category);

        transactionRepository.save(txn);
        transactionRepository.flush();
        applyBalanceEffect(newAccount, request.getType(), request.getAmount(), true);
        syncGoalStatus(txn.getGoal());
        return txn;
    }

    /**
     * Xóa giao dịch sau khi hoàn tác tác động lên tài khoản liên kết.
     */
    @Transactional
    public void delete(User user, Long id) {
        Transaction txn = loadTransactionOwnedByUser(id, user);
        Account acc = resolveAccountForBalance(txn.getAccount());
        if (acc != null) {
            applyBalanceEffect(acc, txn.getType(), txn.getAmount(), false);
        }
        transactionRepository.delete(txn);
        transactionRepository.flush();
        syncGoalStatus(txn.getGoal());
    }

    /**
     * Tính lại trạng thái hoàn thành mục tiêu khi giao dịch SAVING bị sửa hoặc xóa.
     */
    private void syncGoalStatus(Goal goal) {
        if (goal == null) return;
        BigDecimal current = transactionRepository.sumSavingByGoalId(goal.getId());
        BigDecimal target = goal.getTargetAmount() != null ? goal.getTargetAmount() : BigDecimal.ZERO;

        if (current.compareTo(target) < 0) {
            if (goal.getStatus() == GoalStatus.COMPLETED) {
                goal.setStatus(GoalStatus.IN_PROGRESS);
                goal.setCompletedAt(null);
                goalRepository.saveAndFlush(goal);
            }
        } else {
            if (goal.getStatus() == GoalStatus.IN_PROGRESS) {
                goal.setStatus(GoalStatus.COMPLETED);
                goal.setCompletedAt(LocalDate.now());
                goalRepository.saveAndFlush(goal);
            }
        }
    }

    /**
     * Liệt kê giao dịch của user hiện tại với các bộ lọc tùy chọn theo type,
     * category, account, keyword và khoảng ngày.
     */
    public List<TransactionListItemResponse> list(
            User user,
            TransactionType type,
            Long categoryId,
            Long accountId,
            String keyword,
            String from,
            String to
    ) {
        // Mọi truy vấn giao dịch/báo cáo đều bắt đầu bằng phạm vi user đã xác thực.
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

    /**
     * Trả về giao dịch thô để tổng hợp report/dashboard nội bộ.
     */
    public List<Transaction> listRaw(User user, TransactionType type) {
        Specification<Transaction> spec = (root, query, cb) -> cb.equal(root.get("user"), user);
        if (type != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), type));
        }
        return transactionRepository.findAll(spec).stream()
                .sorted((a, b) -> b.getTransactionDate().compareTo(a.getTransactionDate()))
                .toList();
    }

    /**
     * Bảo vệ invariant chung của create/update trước khi thay đổi số dư.
     */
    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "amount must be > 0");
        }
    }

    /**
     * Áp dụng hoặc hoàn tác tác động của giao dịch lên số dư.
     *
     * @param apply true để áp dụng tác động tạo/cập nhật, false để hoàn tác trước khi cập nhật/xóa
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

    /**
     * INCOME làm tăng số dư; EXPENSE và SAVING làm giảm số dư. Khi hoàn tác
     * giao dịch, hệ thống áp dụng phần chênh lệch ngược lại.
     */
    private BigDecimal balanceDelta(TransactionType type, BigDecimal amount, boolean apply) {
        BigDecimal a = amount.abs();
        return switch (type) {
            case INCOME -> apply ? a : a.negate();
            case EXPENSE, SAVING -> apply ? a.negate() : a;
        };
    }

    /**
     * Tải lại entity account trước khi thay đổi số dư để JPA ghi trên bản ghi
     * account mới nhất đã lưu.
     */
    @SuppressWarnings("null")
    private Account resolveAccountForBalance(Account ref) {
        if (ref == null || ref.getId() == null) {
            return null;
        }
        Long accountId = ref.getId();
        return accountRepository.findById(accountId).orElse(null);
    }

    /**
     * Đảm bảo giao dịch không bị đọc hoặc thay đổi chéo giữa các user.
     */
    private Transaction loadTransactionOwnedByUser(Long id, User user) {
        Long transactionId = Objects.requireNonNull(id, "transaction id is required");
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "transaction not found"));
        if (txn.getUser() == null || !txn.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "transaction not accessible");
        }
        return txn;
    }

    /**
     * Đảm bảo nguồn tiền được chọn thuộc user đã xác thực.
     */
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

    /**
     * Đảm bảo danh mục được chọn thuộc user đã xác thực.
     */
    private Category loadCategoryOwnedByUser(Long categoryId, User user) {
        if (categoryId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "categoryId is required");
        }
        Category category = categoryRepository.findByIdAccessibleToUser(categoryId, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "category not found"));
        return category;
    }

    /**
     * Ngăn tổ hợp transaction/category không khớp có thể làm sai tổng báo cáo,
     * ví dụ dùng danh mục thu nhập cho giao dịch chi tiêu.
     */
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

    /**
     * Parse định dạng datetime của mobile API và chấp nhận ISO offset datetime
     * từ client gửi dữ liệu Date native.
     */
    private LocalDateTime parseTransactionDate(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "transactionDate is required");
        }
        try {
            return LocalDateTime.parse(raw.trim(), DateTimeFormats.API_DATE_TIME);
        } catch (Exception e) {
            try {
                return OffsetDateTime.parse(raw.trim()).toLocalDateTime();
            } catch (Exception ignored) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "transactionDate invalid format");
            }
        }
    }

    /**
     * Giữ tương thích ngược với payload mobile từng dùng `sourceId` trước khi
     * backend chuẩn hóa sang `accountId`.
     */
    private Long resolveAccountId(Long accountId, String sourceId) {
        if (accountId != null) {
            return accountId;
        }
        if (sourceId == null || sourceId.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(sourceId.trim());
        } catch (NumberFormatException ignored) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "sourceId must be numeric account id");
        }
    }

    /**
     * Giữ tương thích ngược với payload mobile từng dùng `date`.
     */
    private String resolveTransactionDate(String transactionDate, String date) {
        if (transactionDate != null && !transactionDate.isBlank()) {
            return transactionDate;
        }
        return date;
    }

    /**
     * Chuyển các trường title/detail của mobile thành một trường note ở backend.
     */
    private String resolveNote(String note, String detail, String title) {
        if (detail != null && !detail.isBlank()) {
            return detail;
        }
        if (note != null && !note.isBlank()) {
            return note;
        }
        return title;
    }

    /**
     * Chuyển đổi biên ngày của report/search thành khoảng trọn ngày khi chỉ truyền ngày.
     */
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

    /**
     * Ánh xạ entity sang DTO danh sách rút gọn dùng cho danh sách giao dịch và
     * tìm kiếm báo cáo.
     */
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

    /**
     * Ánh xạ entity sang DTO chi tiết dùng để nạp dữ liệu màn hình chi tiết/sửa.
     */
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
                .imageUrl(txn.getIcon())
                .location(txn.getLocation())
                .transactionDate(txn.getTransactionDate() != null ? txn.getTransactionDate().format(DateTimeFormats.API_DATE_TIME) : null)
                .build();
    }

}
