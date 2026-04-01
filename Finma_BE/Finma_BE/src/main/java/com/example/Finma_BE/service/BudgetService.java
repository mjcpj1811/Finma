package com.example.Finma_BE.service;

import com.example.Finma_BE.dto.request.BudgetRequest;
import com.example.Finma_BE.dto.response.BudgetResponse;
import com.example.Finma_BE.dto.response.CategoryResponse;
import com.example.Finma_BE.entity.Budget;
import com.example.Finma_BE.entity.Category;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.enums.NotificationType;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.repository.BudgetRepository;
import com.example.Finma_BE.repository.CategoryRepository;
import com.example.Finma_BE.repository.TransactionRepository;
import com.example.Finma_BE.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class BudgetService {

    BudgetRepository budgetRepository;
    CategoryRepository categoryRepository;
    TransactionRepository transactionRepository;
    UserRepository userRepository;
    NotificationService notificationService;

    // ===================== HELPER =====================

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
    }

    private BudgetResponse mapToResponse(Budget budget, Long userId) {
        Category category = budget.getCategory();

        // Tính tổng chi tiêu trong kỳ budget
        LocalDateTime startDateTime = budget.getStartDate().atStartOfDay();
        LocalDateTime endDateTime = budget.getEndDate().atTime(23, 59, 59);

        BigDecimal spent = transactionRepository.sumExpenseByCategoryAndPeriod(
                userId,
                category.getId(),
                startDateTime,
                endDateTime
        );
        if (spent == null) spent = BigDecimal.ZERO;

        BigDecimal limit = budget.getAmountLimit();
        BigDecimal remaining = limit.subtract(spent);

        // Tính % đã sử dụng
        double usedPct = 0.0;
        if (limit.compareTo(BigDecimal.ZERO) > 0) {
            usedPct = spent.divide(limit, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        // Xác định trạng thái và gửi thông báo cảnh báo
        String status;
        if (usedPct >= 100.0) {
            status = "EXCEEDED";
            notificationService.createNotification(
                    budget.getUser(),
                    NotificationType.BUDGET_EXCEEDED,
                    "⚠️ Ngân sách vượt mức!",
                    String.format("Ngân sách '%s' đã vượt %.1f%% hạn mức. "
                            + "Bạn đã chi %s / %s.",
                            category.getName(), usedPct,
                            spent.toPlainString(), limit.toPlainString()),
                    budget.getId(), "BUDGET"
            );
        } else if (usedPct >= 80.0) {
            status = "WARNING";
            notificationService.createNotification(
                    budget.getUser(),
                    NotificationType.BUDGET_WARNING,
                    "🟡 Cảnh báo ngân sách",
                    String.format("Ngân sách '%s' đã sử dụng %.1f%%. "
                            + "Còn lại: %s.",
                            category.getName(), usedPct,
                            remaining.toPlainString()),
                    budget.getId(), "BUDGET"
            );
        } else {
            status = "SAFE";
        }

        return BudgetResponse.builder()
                .id(budget.getId())
                .categoryId(category.getId())
                .categoryName(category.getName())
                .categoryIcon(category.getIcon())
                .categoryColor(category.getColor())
                .amountLimit(limit)
                .periodType(budget.getPeriodType())
                .startDate(budget.getStartDate())
                .endDate(budget.getEndDate())
                .isRecurring(budget.getIsRecurring())
                .parentBudgetId(budget.getParentBudgetId())
                .spentAmount(spent)
                .remainingAmount(remaining)
                .usedPercentage(Math.round(usedPct * 100.0) / 100.0)
                .status(status)
                .createdAt(budget.getCreatedAt())
                .updatedAt(budget.getUpdatedAt())
                .build();
    }

    // ===================== APIs =====================

    /**
     * Lấy danh sách tất cả category (EXPENSE) có thể dùng để tạo budget
     */
    public List<CategoryResponse> getAvailableCategories() {
        User user = getCurrentUser();
        return categoryRepository.findExpenseCategoriesByUser(user.getId())
                .stream()
                .map(c -> CategoryResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .type(c.getType())
                        .icon(c.getIcon())
                        .color(c.getColor())
                        .isDefault(c.getIsDefault())
                        .parentId(c.getParent() != null ? c.getParent().getId() : null)
                        .parentName(c.getParent() != null ? c.getParent().getName() : null)
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Tạo budget mới từ một category có sẵn.
     * Nếu isRecurring=true, hệ thống tự gán startDate=ngày 1 tháng hiện tại,
     * endDate=ngày cuối tháng; scheduler sẽ tự sinh lại vào đầu mỗi tháng.
     */
    @Transactional
    public BudgetResponse createBudget(BudgetRequest request) {
        User user = getCurrentUser();

        boolean recurring = Boolean.TRUE.equals(request.getIsRecurring());

        // Tự tính startDate / endDate nếu recurring
        LocalDate startDate;
        LocalDate endDate;
        if (recurring) {
            LocalDate today = LocalDate.now();
            startDate = today.withDayOfMonth(1);                  // Ngày 1 của tháng hiện tại
            endDate   = today.withDayOfMonth(today.lengthOfMonth()); // Ngày cuối tháng
        } else {
            if (request.getStartDate() == null || request.getEndDate() == null) {
                throw new IllegalArgumentException("startDate and endDate are required when isRecurring is false");
            }
            if (!request.getEndDate().isAfter(request.getStartDate())) {
                throw new IllegalArgumentException("End date must be after start date");
            }
            startDate = request.getStartDate();
            endDate   = request.getEndDate();
        }

        // Lấy category và kiểm tra quyền truy cập
        Category category = categoryRepository
                .findByIdAccessibleToUser(request.getCategoryId(), user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // Kiểm tra trùng lặp budget cho category trong cùng khoảng thời gian
        boolean overlapping = budgetRepository.existsOverlappingBudget(
                user.getId(),
                category.getId(),
                startDate,
                endDate,
                null
        );
        if (overlapping) {
            throw new AppException(ErrorCode.BUDGET_ALREADY_EXISTS);
        }

        Budget budget = Budget.builder()
                .amountLimit(request.getAmountLimit())
                .periodType(request.getPeriodType())
                .startDate(startDate)
                .endDate(endDate)
                .isRecurring(recurring)
                .parentBudgetId(null)   // Đây là budget gốc
                .user(user)
                .category(category)
                .build();

        Budget saved = budgetRepository.save(budget);
        log.info("Created budget id={} recurring={} for user={}, category={}",
                saved.getId(), recurring, user.getUsername(), category.getName());
        return mapToResponse(saved, user.getId());
    }

    /**
     * Lấy tất cả budget của user kèm thông tin theo dõi % sử dụng
     */
    public List<BudgetResponse> getAllBudgets() {
        User user = getCurrentUser();
        return budgetRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(b -> mapToResponse(b, user.getId()))
                .collect(Collectors.toList());
    }

    /**
     * Lấy các budget đang active (ngày hiện tại trong kỳ)
     */
    public List<BudgetResponse> getActiveBudgets() {
        User user = getCurrentUser();
        return budgetRepository.findActiveBudgetsByUser(user.getId(), LocalDate.now())
                .stream()
                .map(b -> mapToResponse(b, user.getId()))
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin chi tiết một budget
     */
    public BudgetResponse getBudget(Long budgetId) {
        User user = getCurrentUser();
        Budget budget = budgetRepository.findByIdAndUserId(budgetId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));
        return mapToResponse(budget, user.getId());
    }

    /**
     * Cập nhật thông tin budget (hạn mức, kỳ, ngày, isRecurring)
     */
    @Transactional
    public BudgetResponse updateBudget(Long budgetId, BudgetRequest request) {
        User user = getCurrentUser();

        Budget budget = budgetRepository.findByIdAndUserId(budgetId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));

        boolean recurring = Boolean.TRUE.equals(request.getIsRecurring());

        LocalDate startDate;
        LocalDate endDate;
        if (recurring) {
            // Giữ nguyên kỳ hiện tại của budget, chỉ bật cờ recurring
            startDate = budget.getStartDate();
            endDate   = budget.getEndDate();
        } else {
            if (request.getStartDate() == null || request.getEndDate() == null) {
                throw new IllegalArgumentException("startDate and endDate are required when isRecurring is false");
            }
            if (!request.getEndDate().isAfter(request.getStartDate())) {
                throw new IllegalArgumentException("End date must be after start date");
            }
            startDate = request.getStartDate();
            endDate   = request.getEndDate();
        }

        // Lấy category mới nếu thay đổi
        Category category = categoryRepository
                .findByIdAccessibleToUser(request.getCategoryId(), user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // Kiểm tra trùng lặp (loại trừ chính budget đang sửa)
        boolean overlapping = budgetRepository.existsOverlappingBudget(
                user.getId(),
                category.getId(),
                startDate,
                endDate,
                budgetId
        );
        if (overlapping) {
            throw new AppException(ErrorCode.BUDGET_ALREADY_EXISTS);
        }

        budget.setAmountLimit(request.getAmountLimit());
        budget.setPeriodType(request.getPeriodType());
        budget.setStartDate(startDate);
        budget.setEndDate(endDate);
        budget.setIsRecurring(recurring);
        budget.setCategory(category);

        Budget updated = budgetRepository.save(budget);
        log.info("Updated budget id={} recurring={} for user={}", budgetId, recurring, user.getUsername());
        return mapToResponse(updated, user.getId());
    }

    /**
     * Xoá budget
     */
    @Transactional
    public void deleteBudget(Long budgetId) {
        User user = getCurrentUser();
        Budget budget = budgetRepository.findByIdAndUserId(budgetId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));
        budgetRepository.delete(budget);
        log.info("Deleted budget id={} for user={}", budgetId, user.getUsername());
    }
}
