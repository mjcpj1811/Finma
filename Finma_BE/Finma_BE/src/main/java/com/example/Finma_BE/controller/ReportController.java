package com.example.Finma_BE.controller;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.response.ReportChartResponse;
import com.example.Finma_BE.dto.response.ReportPieItemResponse;
import com.example.Finma_BE.dto.response.ReportSummaryResponse;
import com.example.Finma_BE.entity.Transaction;
import com.example.Finma_BE.enums.GoalStatus;
import com.example.Finma_BE.enums.TransactionType;
import com.example.Finma_BE.repository.AccountRepository;
import com.example.Finma_BE.repository.GoalRepository;
import com.example.Finma_BE.repository.NotificationRepository;
import com.example.Finma_BE.service.AuthContext;
import com.example.Finma_BE.service.ReportService;
import com.example.Finma_BE.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping({"/reports", "/report"})
@RequiredArgsConstructor
public class ReportController {
    private final AuthContext authContext;
    private final ReportService reportService;
    private final TransactionService transactionService;
    private final NotificationRepository notificationRepository;
    private final GoalRepository goalRepository;
    private final AccountRepository accountRepository;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("MMMM dd", Locale.ENGLISH);

    @GetMapping("/summary")
    public ApiResponse<ReportSummaryResponse> summary(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long accountId
    ) {
        var user = authContext.requireCurrentUser();
        var result = reportService.summary(user, from, to, categoryId, accountId);
        return ApiResponse.<ReportSummaryResponse>builder()
                .message("OK")
                .result(result)
                .build();
    }

    @GetMapping("/chart")
    public ApiResponse<ReportChartResponse> chart(
            @RequestParam(required = false) String view,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long accountId
    ) {
        var user = authContext.requireCurrentUser();
        var result = reportService.chart(user, view, from, to, categoryId, accountId);
        return ApiResponse.<ReportChartResponse>builder()
                .message("OK")
                .result(result)
                .build();
    }

    @GetMapping("/pie")
    public ApiResponse<List<ReportPieItemResponse>> pie(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long accountId
    ) {
        var user = authContext.requireCurrentUser();
        var result = reportService.pie(user, from, to, categoryId, accountId);
        return ApiResponse.<List<ReportPieItemResponse>>builder()
                .message("OK")
                .result(result)
                .build();
    }

    @GetMapping("/dashboard")
    public ReportDashboardVm dashboard(@RequestParam(required = false, defaultValue = "day") String period) {
        var user = authContext.requireCurrentUser();
        var summary = reportService.summary(user, null, null, null, null);
        var chart = reportService.chart(user, period, null, null, null, null);
        var unread = notificationRepository.countByUserIdAndIsReadFalse(user.getId());

        BigDecimal totalBalance = accountRepository.findByUser_Id(user.getId()).stream()
                .map(a -> a.getBalance() == null ? BigDecimal.ZERO : a.getBalance())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        var chartPoints = buildChartPoints(chart);
        var goals = goalRepository.findAllByUserIdAndStatus(user.getId(), GoalStatus.IN_PROGRESS).stream()
                .limit(3)
                .map(g -> {
                    BigDecimal saved = reportService.sumSavingByGoal(g.getId());
                    int percent = g.getTargetAmount() == null || g.getTargetAmount().compareTo(BigDecimal.ZERO) <= 0
                            ? 0
                            : saved.multiply(BigDecimal.valueOf(100))
                            .divide(g.getTargetAmount(), 0, java.math.RoundingMode.HALF_UP)
                            .intValue();
                    return new ReportTargetVm(String.valueOf(g.getId()), g.getName(), Math.min(percent, 100));
                }).toList();

        return new ReportDashboardVm(
                new OverviewVm(totalBalance, summary.getTotalExpense(), 0, BigDecimal.ZERO),
                goals.isEmpty() ? "0% Muc tieu, 0 muc tieu sap den han" : goals.size() + " muc tieu dang theo doi",
                summary.getTotalIncome(),
                summary.getTotalExpense(),
                chartPoints,
                goals,
                unread
        );
    }

    @GetMapping("/search/options")
    public ApiResponse<SearchOptionsVm> searchOptions() {
        var user = authContext.requireCurrentUser();
        var options = reportService.searchCategories(user).stream()
                .map(c -> new IdLabelVm(String.valueOf(c.getId()), c.getName()))
                .toList();
        return ApiResponse.<SearchOptionsVm>builder()
                .message("OK")
                .result(new SearchOptionsVm(options))
                .build();
    }

    @PostMapping("/search")
    public ApiResponse<SearchResultVm> search(@RequestBody SearchRequestVm request) {
        var user = authContext.requireCurrentUser();
        TransactionType type = "income".equalsIgnoreCase(request.reportType) ? TransactionType.INCOME : TransactionType.EXPENSE;
        Long categoryId = parseNullableLong(request.categoryId);
        String date = normalizeDate(request.date);
        var rows = transactionService.list(user, type, categoryId, null, request.keyword, date, date);
        var items = rows.stream().map(r -> new SearchItemVm(
                String.valueOf(r.getId()),
                r.getCategory() == null ? "Giao dich" : r.getCategory(),
                toTimeLabel(r.getTransactionDateTime()),
                r.getAmount(),
                "income".equalsIgnoreCase(request.reportType) ? "income" : "expense",
                r.getCategoryId() == null ? null : String.valueOf(r.getCategoryId())
        )).toList();
        return ApiResponse.<SearchResultVm>builder()
                .message("OK")
                .result(new SearchResultVm(items))
                .build();
    }

    @GetMapping("/calendar/transactions")
    public CalendarTransactionsVm calendarTransactions(
            @RequestParam int month,
            @RequestParam int year,
            @RequestParam(required = false) Integer day
    ) {
        var user = authContext.requireCurrentUser();
        var unread = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        var data = reportService.calendarTransactions(user, month, year, day).stream()
                .map(this::toCalendarTransaction)
                .toList();
        return new CalendarTransactionsVm(unread, data);
    }

    @GetMapping("/calendar/categories")
    public CalendarCategoriesVm calendarCategories(
            @RequestParam int month,
            @RequestParam int year,
            @RequestParam(required = false) Integer day
    ) {
        var user = authContext.requireCurrentUser();
        var unread = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        var slices = reportService.calendarCategorySlices(user, month, year, day).stream()
                .map(s -> new CategorySliceVm(s.id(), s.label(), s.percent(), s.color()))
                .toList();
        return new CalendarCategoriesVm(unread, slices);
    }

    private List<ChartPointVm> buildChartPoints(ReportChartResponse chart) {
        return java.util.stream.IntStream.range(0, chart.getLabels().size())
                .mapToObj(i -> new ChartPointVm(
                        chart.getLabels().get(i).toLowerCase(),
                        chart.getLabels().get(i),
                        chart.getIncome().get(i),
                        chart.getExpense().get(i)
                ))
                .toList();
    }

    private CalendarTransactionItemVm toCalendarTransaction(Transaction t) {
        String kind = t.getType() == TransactionType.INCOME ? "income" : "expense";
        BigDecimal amount = t.getType() == TransactionType.EXPENSE ? t.getAmount().negate() : t.getAmount();
        String timeLabel = t.getTransactionDate() == null ? "" :
                t.getTransactionDate().format(TIME_FMT) + " - " + t.getTransactionDate().format(DAY_FMT);
        return new CalendarTransactionItemVm(
                String.valueOf(t.getId()),
                t.getCategory() == null ? "Giao dich" : t.getCategory().getName(),
                timeLabel,
                t.getNote(),
                amount,
                kind
        );
    }

    private String normalizeDate(String input) {
        if (input == null || input.isBlank()) {
            return null;
        }
        String value = input.trim();
        if (value.length() >= 10) {
            return value.substring(0, 10);
        }
        return value;
    }

    private String toTimeLabel(String txnDateTime) {
        if (txnDateTime == null || txnDateTime.isBlank()) {
            return "";
        }
        if (txnDateTime.length() >= 16) {
            return txnDateTime.substring(11, 16) + " - " + txnDateTime.substring(0, 10);
        }
        return txnDateTime;
    }

    private Long parseNullableLong(String value) {
        if (value == null || value.isBlank() || "all".equalsIgnoreCase(value)) {
            return null;
        }
        return Long.parseLong(value.trim());
    }

    public record OverviewVm(BigDecimal totalBalance, BigDecimal totalExpense, int budgetUsedPercent, BigDecimal budgetLimit) {}
    public record ChartPointVm(String id, String label, BigDecimal income, BigDecimal expense) {}
    public record ReportTargetVm(String id, String title, int progressPercent) {}
    public record ReportDashboardVm(
            OverviewVm overview,
            String goalSummaryText,
            BigDecimal incomeTotal,
            BigDecimal expenseTotal,
            List<ChartPointVm> chart,
            List<ReportTargetVm> targets,
            long unreadNotifications
    ) {}
    public record IdLabelVm(String id, String label) {}
    public record SearchOptionsVm(List<IdLabelVm> categories) {}
    public record SearchRequestVm(String keyword, String categoryId, String date, String reportType) {}
    public record SearchItemVm(String id, String title, String timeLabel, BigDecimal amount, String type, String categoryId) {}
    public record SearchResultVm(List<SearchItemVm> items) {}
    public record CalendarTransactionItemVm(String id, String title, String timeLabel, String subLabel, BigDecimal amount, String kind) {}
    public record CalendarTransactionsVm(long unreadNotifications, List<CalendarTransactionItemVm> items) {}
    public record CategorySliceVm(String id, String label, int percent, String color) {}
    public record CalendarCategoriesVm(long unreadNotifications, List<CategorySliceVm> slices) {}
}
