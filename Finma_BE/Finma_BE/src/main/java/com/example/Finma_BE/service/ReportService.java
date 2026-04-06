package com.example.Finma_BE.service;

import com.example.Finma_BE.dto.response.ReportChartResponse;
import com.example.Finma_BE.dto.response.ReportPieItemResponse;
import com.example.Finma_BE.dto.response.ReportSummaryResponse;
import com.example.Finma_BE.entity.Transaction;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.enums.TransactionType;
import com.example.Finma_BE.exception.ApiException;
import com.example.Finma_BE.repository.TransactionRepository;
import com.example.Finma_BE.util.DateTimeFormats;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.*;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final TransactionRepository transactionRepository;

    public ReportSummaryResponse summary(User user, String from, String to, Long categoryId, Long accountId) {
        var txns = queryUserTransactions(user, from, to, null, categoryId, accountId);
        var income = sumByType(txns, TransactionType.INCOME);
        var expense = sumByType(txns, TransactionType.EXPENSE);
        return ReportSummaryResponse.builder()
                .totalIncome(income)
                .totalExpense(expense)
                .balance(income.subtract(expense))
                .build();
    }

    public ReportChartResponse chart(User user, String view, String from, String to, Long categoryId, Long accountId) {
        String v = normalizeView(view);
        var txns = queryUserTransactions(user, from, to, null, categoryId, accountId);

        List<String> labels = switch (v) {
            case "day" -> List.of("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
            case "week" -> List.of("1st Week", "2nd Week", "3rd Week", "4th Week");
            case "month" -> monthLabels(from, to);
            case "year" -> yearLabels(from, to);
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "view must be day|week|month|year");
        };

        Map<String, BigDecimal> incomeMap = aggregate(txns, v, TransactionType.INCOME);
        Map<String, BigDecimal> expenseMap = aggregate(txns, v, TransactionType.EXPENSE);

        List<BigDecimal> income = labels.stream().map(l -> incomeMap.getOrDefault(l, BigDecimal.ZERO)).toList();
        List<BigDecimal> expense = labels.stream().map(l -> expenseMap.getOrDefault(l, BigDecimal.ZERO)).toList();

        var summary = ReportSummaryResponse.builder()
                .totalIncome(sum(income))
                .totalExpense(sum(expense))
                .balance(sum(income).subtract(sum(expense)))
                .build();

        return ReportChartResponse.builder()
                .view(v)
                .labels(labels)
                .income(income)
                .expense(expense)
                .summary(summary)
                .build();
    }

    public List<ReportPieItemResponse> pie(User user, String from, String to, Long categoryId, Long accountId) {
        var txns = queryUserTransactions(user, from, to, TransactionType.EXPENSE, categoryId, accountId);
        Map<String, BigDecimal> byCategory = new HashMap<>();
        for (Transaction t : txns) {
            String key = t.getCategory() != null ? t.getCategory().getName() : "Others";
            byCategory.put(key, byCategory.getOrDefault(key, BigDecimal.ZERO).add(zeroIfNull(t.getAmount())));
        }
        return byCategory.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .map(e -> ReportPieItemResponse.builder().category(e.getKey()).amount(e.getValue()).build())
                .toList();
    }

    private List<Transaction> queryUserTransactions(
            User user,
            String from,
            String to,
            TransactionType type,
            Long categoryId,
            Long accountId
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

        LocalDateTime fromDt = parseDateBound(from, true);
        LocalDateTime toDt = parseDateBound(to, false);

        if (fromDt != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("transactionDate"), fromDt));
        }
        if (toDt != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("transactionDate"), toDt));
        }
        return transactionRepository.findAll(spec);
    }

    private LocalDateTime parseDateBound(String dateOrDateTime, boolean isStart) {
        if (dateOrDateTime == null || dateOrDateTime.isBlank()) return null;
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

    private String normalizeView(String view) {
        if (view == null) return "day";
        return view.trim().toLowerCase(Locale.ROOT);
    }

    private BigDecimal sumByType(List<Transaction> txns, TransactionType type) {
        return txns.stream()
                .filter(t -> t.getType() == type)
                .map(Transaction::getAmount)
                .map(this::zeroIfNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal zeroIfNull(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private BigDecimal sum(List<BigDecimal> values) {
        return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Map<String, BigDecimal> aggregate(List<Transaction> txns, String view, TransactionType type) {
        Map<String, BigDecimal> map = new HashMap<>();
        for (Transaction t : txns) {
            if (t.getType() != type) continue;
            if (t.getTransactionDate() == null) continue;
            String key = switch (view) {
                case "day" -> dayLabel(t.getTransactionDate().getDayOfWeek());
                case "week" -> weekLabel(t.getTransactionDate().toLocalDate().getDayOfMonth());
                case "month" -> monthLabel(t.getTransactionDate().getMonth());
                case "year" -> String.valueOf(t.getTransactionDate().getYear());
                default -> throw new ApiException(HttpStatus.BAD_REQUEST, "view must be day|week|month|year");
            };
            map.put(key, map.getOrDefault(key, BigDecimal.ZERO).add(zeroIfNull(t.getAmount())));
        }
        return map;
    }

    private String dayLabel(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "Mon";
            case TUESDAY -> "Tue";
            case WEDNESDAY -> "Wed";
            case THURSDAY -> "Thu";
            case FRIDAY -> "Fri";
            case SATURDAY -> "Sat";
            case SUNDAY -> "Sun";
        };
    }

    private String weekLabel(int dayOfMonth) {
        int week = ((dayOfMonth - 1) / 7) + 1;
        if (week > 4) week = 4;
        return switch (week) {
            case 1 -> "1st Week";
            case 2 -> "2nd Week";
            case 3 -> "3rd Week";
            default -> "4th Week";
        };
    }

    private String monthLabel(Month m) {
        return m.getDisplayName(java.time.format.TextStyle.SHORT, Locale.ENGLISH);
    }

    private List<String> monthLabels(String from, String to) {
        LocalDateTime f = parseDateBound(from, true);
        LocalDateTime t = parseDateBound(to, false);
        if (f == null || t == null) {
            return Arrays.stream(Month.values()).map(this::monthLabel).toList();
        }
        if (f.getYear() != t.getYear()) {
            return Arrays.stream(Month.values()).map(this::monthLabel).toList();
        }
        int start = f.getMonthValue();
        int end = t.getMonthValue();
        return IntStream.rangeClosed(start, end)
                .mapToObj(i -> monthLabel(Month.of(i)))
                .toList();
    }

    private List<String> yearLabels(String from, String to) {
        LocalDateTime f = parseDateBound(from, true);
        LocalDateTime t = parseDateBound(to, false);
        if (f == null || t == null) {
            int y = LocalDate.now().getYear();
            return List.of(String.valueOf(y - 4), String.valueOf(y - 3), String.valueOf(y - 2), String.valueOf(y - 1), String.valueOf(y));
        }
        int start = f.getYear();
        int end = t.getYear();
        return IntStream.rangeClosed(start, end).mapToObj(String::valueOf).toList();
    }
}
