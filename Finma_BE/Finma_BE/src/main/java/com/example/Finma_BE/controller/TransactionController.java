package com.example.Finma_BE.controller;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.request.CreateTransactionRequest;
import com.example.Finma_BE.dto.request.UpdateTransactionRequest;
import com.example.Finma_BE.dto.response.TransactionListItemResponse;
import com.example.Finma_BE.entity.Transaction;
import com.example.Finma_BE.enums.TransactionType;
import com.example.Finma_BE.repository.AccountRepository;
import com.example.Finma_BE.repository.CategoryRepository;
import com.example.Finma_BE.repository.NotificationRepository;
import com.example.Finma_BE.service.AuthContext;
import com.example.Finma_BE.service.TransactionService;
import com.example.Finma_BE.util.DateTimeFormats;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final AuthContext authContext;
    private final TransactionService transactionService;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationRepository notificationRepository;
    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("MMMM");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("MMMM dd");

    @PostMapping
        public ApiResponse<CreateTransactionResultVm> create(@Valid @RequestBody CreateTransactionRequest request) {
        var user = authContext.requireCurrentUser();
        var created = transactionService.create(user, request);
                return ApiResponse.<CreateTransactionResultVm>builder()
                                .message("Created")
                                .result(new CreateTransactionResultVm(created.getId()))
                                .build();
    }

    @GetMapping
        public ApiResponse<List<TransactionListItemResponse>> list(
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        var user = authContext.requireCurrentUser();
        var items = transactionService.list(user, type, categoryId, accountId, q, from, to);
        return ApiResponse.<List<TransactionListItemResponse>>builder()
                .message("OK")
                .result(items)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<TransactionDetailResponseVm> getById(@PathVariable Long id) {
        var user = authContext.requireCurrentUser();
        var txn = transactionService.getById(user, id);
        return ApiResponse.<TransactionDetailResponseVm>builder()
                .message("OK")
                .result(toDetailResponseVm(txn))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTransactionRequest request
    ) {
        var user = authContext.requireCurrentUser();
        transactionService.update(user, id, request);
        return ApiResponse.<Void>builder()
                .message("Updated")
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        var user = authContext.requireCurrentUser();
        transactionService.delete(user, id);
        return ApiResponse.<Void>builder()
                .message("Deleted")
                .build();
    }

    @GetMapping("/dashboard")
    public TransactionDashboardVm dashboard(@RequestParam(defaultValue = "all") String filter) {
        var user = authContext.requireCurrentUser();
        TransactionType type = switch (filter.toLowerCase()) {
            case "income" -> TransactionType.INCOME;
            case "expense" -> TransactionType.EXPENSE;
            default -> null;
        };

        var items = transactionService.listRaw(user, type);
        BigDecimal totalIncome = items.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpense = items.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalBalance = accountRepository.findByUser_Id(user.getId()).stream()
                .map(a -> a.getBalance() == null ? BigDecimal.ZERO : a.getBalance())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long unread = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        var cards = items.stream().limit(50).map(this::toDashboardItem).toList();

        return new TransactionDashboardVm(
                new TransactionOverviewVm(totalBalance, totalIncome, totalExpense, unread),
                cards
        );
    }

    @GetMapping("/form-options")
    public TransactionFormOptionsVm formOptions() {
        var user = authContext.requireCurrentUser();
        var categories = categoryRepository.findAllByUser(user.getId()).stream()
                .map(c -> new IdLabelTypeVm(
                        String.valueOf(c.getId()),
                        c.getName(),
                        c.getType() == null ? "expense" : c.getType().name().toLowerCase()
                ))
                .toList();
        var sources = accountRepository.findByUser_Id(user.getId()).stream()
                .map(a -> new IdLabelVm(String.valueOf(a.getId()), a.getName()))
                .toList();
        return new TransactionFormOptionsVm(categories, sources);
    }

    private TransactionDashboardItemVm toDashboardItem(Transaction t) {
        String kind = t.getType() == TransactionType.INCOME ? "income" : "expense";
        BigDecimal amount = t.getType() == TransactionType.EXPENSE ? t.getAmount().negate() : t.getAmount();
        String monthLabel = t.getTransactionDate() == null ? "" : t.getTransactionDate().format(MONTH_FMT);
        String timeLabel = t.getTransactionDate() == null ? "" :
                t.getTransactionDate().format(TIME_FMT) + " - " + t.getTransactionDate().format(DAY_FMT);
        String iconKey = t.getType() == TransactionType.INCOME ? "salary" : mapExpenseIcon(t);
        return new TransactionDashboardItemVm(
                String.valueOf(t.getId()),
                monthLabel,
                t.getCategory() != null ? t.getCategory().getName() : "Giao dịch",
                timeLabel,
                t.getNote(),
                amount,
                kind,
                iconKey
        );
    }

    private String mapExpenseIcon(Transaction t) {
        String categoryName = t.getCategory() != null && t.getCategory().getName() != null
                ? t.getCategory().getName().toLowerCase()
                : "";
        if (categoryName.contains("food") || categoryName.contains("ẩm") || categoryName.contains("thực")) return "food";
        if (categoryName.contains("rent") || categoryName.contains("nhà")) return "rent";
        if (categoryName.contains("transport") || categoryName.contains("xăng") || categoryName.contains("đi")) return "transport";
        return "other";
    }

    private TransactionDetailResponseVm toDetailResponseVm(Transaction t) {
        return new TransactionDetailResponseVm(
                t.getId(),
                t.getType(),
                t.getAmount(),
                t.getCategory() == null ? null : t.getCategory().getId(),
                t.getCategory() == null ? null : t.getCategory().getName(),
                t.getAccount() == null ? null : t.getAccount().getId(),
                t.getAccount() == null ? null : t.getAccount().getName(),
                t.getGoal() == null ? null : t.getGoal().getId(),
                t.getGoal() == null ? null : t.getGoal().getName(),
                t.getNote(),
                t.getTransactionDate() == null ? null : t.getTransactionDate().format(DateTimeFormats.API_DATE_TIME)
        );
    }

    public record CreateTransactionResultVm(Long id) {}
    public record TransactionOverviewVm(BigDecimal totalBalance, BigDecimal totalIncome, BigDecimal totalExpense, long unreadNotifications) {}
    public record TransactionDashboardVm(TransactionOverviewVm overview, List<TransactionDashboardItemVm> items) {}
    public record TransactionDashboardItemVm(
            String id, String monthLabel, String title, String timeLabel, String note, BigDecimal amount, String kind, String iconKey
    ) {}
    public record IdLabelTypeVm(String id, String label, String type) {}
    public record IdLabelVm(String id, String label) {}
    public record TransactionFormOptionsVm(List<IdLabelTypeVm> categories, List<IdLabelVm> sources) {}
    public record TransactionDetailResponseVm(
            Long id,
            TransactionType type,
            BigDecimal amount,
            Long categoryId,
            String categoryName,
            Long accountId,
            String accountName,
            Long goalId,
            String goalName,
            String note,
            String transactionDate
    ) {}
}
