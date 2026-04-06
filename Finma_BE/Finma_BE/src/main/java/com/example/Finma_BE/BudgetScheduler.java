package com.example.Finma_BE.finance;

import com.example.Finma_BE.entity.Budget;
import com.example.Finma_BE.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduler tự động sinh ngân sách hàng tháng vào lúc 00:00:00 ngày 1 mỗi tháng.
 *
 * Luồng hoạt động:
 *  1. Tìm tất cả recurring budget gốc (isRecurring=true, parentBudgetId=null).
 *  2. Với mỗi budget, tính startDate/endDate của tháng hiện tại.
 *  3. Nếu chưa có budget nào cho category đó trong tháng này → tạo mới.
 *  4. Budget mới có parentBudgetId trỏ về budget gốc để trace lịch sử.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class BudgetScheduler {

    BudgetRepository budgetRepository;

    /**
     * Cron: "0 0 0 1 * *" → chạy lúc 00:00:00 vào ngày 1 mỗi tháng
     *
     * Để test nhanh, tạm thời có thể thay bằng:
     *   "0 * * * * *"  → mỗi phút (rồi comment lại sau)
     */
    @Scheduled(cron = "0 0 0 1 * *")
    @Transactional
    public void autoGenerateMonthlyBudgets() {
        LocalDate today = LocalDate.now();  // Ngày 1 của tháng mới (do cron kích hoạt)
        LocalDate startDate = today.withDayOfMonth(1);
        LocalDate endDate   = today.withDayOfMonth(today.lengthOfMonth());

        log.info("[BudgetScheduler] Running auto-generate for period {} → {}", startDate, endDate);

        List<Budget> recurringRoots = budgetRepository.findAllRecurringRootBudgets();
        log.info("[BudgetScheduler] Found {} recurring root budgets", recurringRoots.size());

        int created = 0;
        int skipped = 0;

        for (Budget root : recurringRoots) {
            Long userId     = root.getUser().getId();
            Long categoryId = root.getCategory().getId();

            // Kiểm tra tháng này đã sinh budget cho category này chưa
            boolean alreadyExists = budgetRepository
                    .existsByUserAndCategoryAndStartDate(userId, categoryId, startDate);

            if (alreadyExists) {
                log.debug("[BudgetScheduler] Skip - budget already exists for user={} category={} start={}",
                        userId, categoryId, startDate);
                skipped++;
                continue;
            }

            // Tìm parentBudgetId: nếu root là budget gốc thì dùng id của nó,
            // nếu không thì dùng parentBudgetId của nó (trường hợp root bị thay thế)
            Long parentId = root.getParentBudgetId() != null ? root.getParentBudgetId() : root.getId();

            Budget newBudget = Budget.builder()
                    .amountLimit(root.getAmountLimit())     // Kế thừa hạn mức từ tháng trước
                    .periodType(root.getPeriodType())
                    .startDate(startDate)
                    .endDate(endDate)
                    .isRecurring(true)
                    .parentBudgetId(parentId)               // Trỏ về budget gốc
                    .user(root.getUser())
                    .category(root.getCategory())
                    .build();

            budgetRepository.save(newBudget);
            created++;

            log.info("[BudgetScheduler] Created budget for user={} category={} period={}/{}",
                    userId, categoryId, startDate, endDate);
        }

        log.info("[BudgetScheduler] Done. created={} skipped={}", created, skipped);
    }
}
