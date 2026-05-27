package com.example.Finma_BE.service;

import com.example.Finma_BE.dto.response.ReportChartResponse;
import com.example.Finma_BE.dto.response.ReportPieItemResponse;
import com.example.Finma_BE.dto.response.ReportSummaryResponse;
import com.example.Finma_BE.entity.Category;
import com.example.Finma_BE.entity.Transaction;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.enums.TransactionType;
import com.example.Finma_BE.exception.ApiException;
import com.example.Finma_BE.repository.CategoryRepository;
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
    private final CategoryRepository categoryRepository;

    /**
     * Tính tổng thu nhập, tổng chi tiêu và số dư ròng từ các giao dịch thuộc
     * một user, có áp dụng bộ lọc tùy chọn.
     */
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

    /**
     * Tạo biểu đồ thu nhập/chi tiêu trong đó labels, income và expense dùng cùng
     * thứ tự index.
     */
    public ReportChartResponse chart(User user, String view, String from, String to, Long categoryId, Long accountId) {
        String v = normalizeView(view);
        ChartWindow chartWindow = resolveChartWindow(v, from, to);
        var txns = queryUserTransactions(user, chartWindow.from(), chartWindow.to(), null, categoryId, accountId);

        List<String> labels = switch (v) {
            case "day" -> List.of("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
            case "week" -> List.of("1st Week", "2nd Week", "3rd Week", "4th Week");
            case "month" -> chartWindow.labels();
            case "year" -> chartWindow.labels();
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

    /**
     * Nhóm giao dịch chi tiêu theo danh mục cho view phân bổ chi tiêu.
     */
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

    /**
     * Truy vấn báo cáo trung tâm: luôn giới hạn theo user, sau đó lọc tùy chọn
     * theo type, category, account và biên ngày.
     */
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

    /**
     * Chuyển đổi bộ lọc ngày. Giá trị chỉ có ngày sẽ mở rộng thành đầu/cuối ngày đó.
     */
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

    /**
     * Mặc định về view day để dashboard tải được khi không truyền period.
     */
    private String normalizeView(String view) {
        if (view == null) return "day";
        return view.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Tính tổng amount giao dịch theo một transaction type.
     */
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

    /**
     * Gom giao dịch vào bucket nhãn mà view được chọn yêu cầu.
     */
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

    /**
     * Giữ nhãn thứ trong tuần khớp với nhãn biểu đồ mobile.
     */
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

    /**
     * Chia một tháng thành bốn cột biểu đồ; các ngày sau ngày 28 vẫn nằm trong
     * bucket thứ tư để giữ contract FE hiện có.
     */
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

    /**
     * Tạo cửa sổ biểu đồ dạng rolling cho view month/year và giữ khoảng ngày do
     * controller truyền vào cho view day/week.
     */
    private ChartWindow resolveChartWindow(String view, String from, String to) {
        LocalDateTime fromDt = parseDateBound(from, true);
        LocalDate referenceDate = (fromDt != null ? fromDt.toLocalDate() : LocalDate.now());

        if ("month".equals(view)) {
            int refMonth = referenceDate.getMonthValue();

            // Hành vi mong muốn:
            // - tháng 1..5 => 1..5
            // - tháng >= 6 => (tháng-5)..tháng
            int startMonth = Math.max(1, refMonth - 5);
            int endMonth = Math.max(5, refMonth);

            LocalDate windowStart = LocalDate.of(referenceDate.getYear(), startMonth, 1);
            LocalDate endMonthDate = LocalDate.of(referenceDate.getYear(), endMonth, 1);
            LocalDate windowEnd = endMonthDate.withDayOfMonth(endMonthDate.lengthOfMonth());

            List<String> labels = IntStream.rangeClosed(startMonth, endMonth)
                    .mapToObj(i -> monthLabel(Month.of(i)))
                    .toList();

            return new ChartWindow(windowStart.toString(), windowEnd.toString(), labels);
        }

        if ("year".equals(view)) {
            int refYear = referenceDate.getYear();
            int startYear = refYear - 2;
            int endYear = refYear + 2;

            List<String> labels = IntStream.rangeClosed(startYear, endYear)
                    .mapToObj(String::valueOf)
                    .toList();

            return new ChartWindow(
                    LocalDate.of(startYear, 1, 1).toString(),
                    LocalDate.of(endYear, 12, 31).toString(),
                    labels
            );
        }

        // day/week giữ cửa sổ lọc hiện tại từ ReportController
        List<String> labels = "week".equals(view)
                ? List.of("1st Week", "2nd Week", "3rd Week", "4th Week")
                : List.of("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
        return new ChartWindow(from, to, labels);
    }

    /**
     * Tính tổng giao dịch SAVING của một mục tiêu để hiển thị tiến độ liên quan.
     */
    public BigDecimal sumSavingByGoal(Long goalId) {
        return transactionRepository.sumSavingByGoalId(goalId);
    }

    /**
     * Trả về các option danh mục cho form tìm kiếm báo cáo.
     */
    public List<Category> searchCategories(User user) {
        return categoryRepository.findAllByUser(user.getId());
    }

    /**
     * Trả về giao dịch theo tháng/năm lịch và ngày tùy chọn.
     */
    public List<Transaction> calendarTransactions(User user, int month, int year, Integer day) {
        var txns = queryUserTransactions(user, null, null, null, null, null);
        return txns.stream()
                .filter(t -> t.getTransactionDate() != null)
                .filter(t -> t.getTransactionDate().getMonthValue() == month)
                .filter(t -> t.getTransactionDate().getYear() == year)
                .filter(t -> day == null || t.getTransactionDate().getDayOfMonth() == day)
                .sorted((a, b) -> b.getTransactionDate().compareTo(a.getTransactionDate()))
                .toList();
    }

    /**
     * Tính tỷ trọng chi tiêu của từng danh mục trong kỳ lịch được chọn. Thu nhập
     * được loại khỏi phần phân bổ này.
     */
    public List<CalendarSlice> calendarCategorySlices(User user, int month, int year, Integer day) {
        var txns = calendarTransactions(user, month, year, day).stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .toList();
        BigDecimal total = txns.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }

        Map<String, BigDecimal> byCategory = new HashMap<>();
        for (Transaction t : txns) {
            String label = t.getCategory() == null ? "Other" : t.getCategory().getName();
            byCategory.put(label, byCategory.getOrDefault(label, BigDecimal.ZERO).add(zeroIfNull(t.getAmount())));
        }

        String[] colors = {"#2563EB", "#1D9BF0", "#60A5FA", "#93C5FD", "#DBEAFE"};
        int index = 0;
        List<CalendarSlice> result = new ArrayList<>();
        for (var entry : byCategory.entrySet()) {
            int percent = entry.getValue()
                    .multiply(BigDecimal.valueOf(100))
                    .divide(total, 0, java.math.RoundingMode.HALF_UP)
                    .intValue();
            result.add(new CalendarSlice(
                    entry.getKey().toLowerCase(Locale.ROOT).replace(" ", "-"),
                    entry.getKey(),
                    percent,
                    colors[index % colors.length]
            ));
            index++;
        }
        return result;
    }

    private record ChartWindow(String from, String to, List<String> labels) {}

    public record CalendarSlice(String id, String label, int percent, String color) {}
}
