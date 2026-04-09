package com.example.Finma_BE.controller;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.request.CreateTransactionRequest;
import com.example.Finma_BE.dto.request.UpdateTransactionRequest;
import com.example.Finma_BE.dto.response.TransactionDetailResponse;
import com.example.Finma_BE.dto.response.TransactionListItemResponse;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    public ApiResponse<TransactionDetailResponse> getById(@PathVariable Long id) {
        var user = authContext.requireCurrentUser();
        var txn = transactionService.getById(user, id);
        return ApiResponse.<TransactionDetailResponse>builder()
                .message("OK")
                                .result(txn)
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

        var items = transactionService.list(user, type, null, null, null, null, null);
        BigDecimal totalIncome = items.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(TransactionListItemResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpense = items.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(TransactionListItemResponse::getAmount)
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

    private TransactionDashboardItemVm toDashboardItem(TransactionListItemResponse t) {
        String kind = t.getType() == TransactionType.INCOME ? "income" : "expense";
        BigDecimal amount = t.getType() == TransactionType.EXPENSE ? t.getAmount().negate() : t.getAmount();
        LocalDateTime txnDateTime = parseTransactionDateTime(t.getTransactionDateTime(), t.getDate());
        String monthLabel = txnDateTime == null ? "" : txnDateTime.format(MONTH_FMT);
        String timeLabel = txnDateTime == null ? "" :
                txnDateTime.format(TIME_FMT) + " - " + txnDateTime.format(DAY_FMT);
        String iconKey = resolveIconKey(t);
        return new TransactionDashboardItemVm(
                String.valueOf(t.getId()),
                monthLabel,
                t.getCategory() != null ? t.getCategory() : "Giao dịch",
                timeLabel,
                t.getNote(),
                amount,
                kind,
                iconKey
        );
    }

        private String resolveIconKey(TransactionListItemResponse t) {
                if (t.getCategoryIcon() != null && !t.getCategoryIcon().isBlank()) {
                        return t.getCategoryIcon();
                }
                if (t.getType() == TransactionType.INCOME) {
                        return "salary";
                }
                String categoryName = t.getCategory() != null ? t.getCategory().toLowerCase() : "";
                if (categoryName.contains("food") || categoryName.contains("ẩm") || categoryName.contains("thực")) return "food";
                if (categoryName.contains("rent") || categoryName.contains("nhà")) return "rent";
                if (categoryName.contains("transport") || categoryName.contains("xăng") || categoryName.contains("đi")) return "transport";
        return "other";
    }

        private LocalDateTime parseTransactionDateTime(String dateTime, String date) {
                try {
                        if (dateTime != null && !dateTime.isBlank()) {
                                return LocalDateTime.parse(dateTime, DateTimeFormats.API_DATE_TIME);
                        }
                        if (date != null && !date.isBlank()) {
                                return LocalDate.parse(date, DateTimeFormats.API_DATE).atStartOfDay();
                        }
                } catch (Exception ignored) {
                }
                return null;
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
}
