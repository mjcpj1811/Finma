package com.example.Finma_BE.util;

import com.example.Finma_BE.dto.request.CreateTransactionRequest;
import com.example.Finma_BE.entity.RecurringTransaction;
import com.example.Finma_BE.enums.CategoryType;
import com.example.Finma_BE.enums.TransactionType;
import com.example.Finma_BE.repository.RecurringTransactionRepository;
import com.example.Finma_BE.repository.TransactionRepository;
import com.example.Finma_BE.service.TransactionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;

/**
 * Tu dong tao giao dich tu cac khoan dinh ky den han.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RecurringTransactionScheduler {

    static final String AUTO_MARKER_PREFIX = "AUTO_RECURRING";

    RecurringTransactionRepository recurringTransactionRepository;
    TransactionRepository transactionRepository;
    TransactionService transactionService;

    /**
     * Chay hang ngay luc 00:05 (gio ung dung) de tao giao dich dinh ky.
     */
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void autoCreateDueTransactions() {
        LocalDate today = LocalDate.now(DateTimeFormats.APP_ZONE);
        var candidates = recurringTransactionRepository.findSchedulableByDate(today);

        int created = 0;
        int skipped = 0;
        int failed = 0;

        for (RecurringTransaction recurring : candidates) {
            if (!isDueToday(recurring, today)) {
                skipped++;
                continue;
            }

            if (!isRunnable(recurring)) {
                failed++;
                log.warn("[RecurringTransactionScheduler] Skip recurringId={} due to missing user/account/category", recurring.getId());
                continue;
            }

            String marker = buildExecutionMarker(recurring.getId(), today);
            if (alreadyGeneratedForDate(recurring.getUser().getId(), marker)) {
                skipped++;
                continue;
            }

            try {
                transactionService.create(recurring.getUser(), buildCreateRequest(recurring, today, marker));
                created++;
            } catch (Exception ex) {
                failed++;
                log.error("[RecurringTransactionScheduler] Failed to generate transaction for recurringId={}", recurring.getId(), ex);
            }
        }

        log.info("[RecurringTransactionScheduler] Completed on {}: created={}, skipped={}, failed={}",
                today, created, skipped, failed);
    }

    /**
     * Kiem tra da tao giao dich cho ngay nay chua (dua tren marker).
     */
    private boolean alreadyGeneratedForDate(Long userId, String marker) {
        return transactionRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .anyMatch(txn -> txn.getNote() != null && txn.getNote().contains(marker));
    }

    /**
     * Kiem tra du du lieu de sinh giao dich tu dinh ky.
     */
    private boolean isRunnable(RecurringTransaction recurring) {
        return recurring.getUser() != null
                && recurring.getUser().getId() != null
                && recurring.getAccount() != null
                && recurring.getAccount().getId() != null
                && recurring.getCategory() != null
                && recurring.getCategory().getId() != null
                && recurring.getAmount() != null;
    }

    /**
     * Xac dinh dinh ky co den han hom nay khong.
     */
    private boolean isDueToday(RecurringTransaction recurring, LocalDate today) {
        if (recurring.getFrequency() == null || recurring.getStartDate() == null || today.isBefore(recurring.getStartDate())) {
            return false;
        }

        return switch (recurring.getFrequency()) {
            case DAILY -> true;
            case WEEKLY -> isWeeklyDue(recurring.getDayOfWeek(), today);
            case MONTHLY -> isMonthlyDue(resolveDayOfMonth(recurring), today);
            case YEARLY -> isYearlyDue(recurring, today);
        };
    }

    /**
     * Kiem tra den han theo tuan.
     */
    private boolean isWeeklyDue(Integer dayOfWeek, LocalDate today) {
        if (dayOfWeek == null) {
            return false;
        }
        int currentDayOfWeek = today.getDayOfWeek().getValue() % 7;
        return dayOfWeek == currentDayOfWeek;
    }

    /**
     * Kiem tra den han theo thang (can bang ngay vuot qua so ngay cua thang).
     */
    private boolean isMonthlyDue(Integer dayOfMonth, LocalDate today) {
        if (dayOfMonth == null) {
            return false;
        }
        int dueDay = Math.min(dayOfMonth, today.lengthOfMonth());
        return dueDay == today.getDayOfMonth();
    }

    /**
     * Kiem tra den han theo nam (dung thang bat dau).
     */
    private boolean isYearlyDue(RecurringTransaction recurring, LocalDate today) {
        if (recurring.getStartDate() == null || today.getMonth() != recurring.getStartDate().getMonth()) {
            return false;
        }
        return isMonthlyDue(resolveDayOfMonth(recurring), today);
    }

    /**
     * Xac dinh ngay trong thang cho lich dinh ky.
     */
    private Integer resolveDayOfMonth(RecurringTransaction recurring) {
        if (recurring.getDayOfMonth() != null) {
            return recurring.getDayOfMonth();
        }
        return recurring.getStartDate() != null ? recurring.getStartDate().getDayOfMonth() : null;
    }

    /**
     * Tao request giao dich tu dinh ky.
     */
    private CreateTransactionRequest buildCreateRequest(RecurringTransaction recurring, LocalDate today, String marker) {
        CreateTransactionRequest request = new CreateTransactionRequest();
        request.setType(resolveTransactionType(recurring));
        request.setAmount(recurring.getAmount());
        request.setCategoryId(recurring.getCategory().getId());
        request.setAccountId(recurring.getAccount().getId());
        request.setNote(buildNote(recurring, marker));
        request.setTransactionDate(today.atStartOfDay().format(DateTimeFormats.API_DATE_TIME));
        return request;
    }

    /**
     * Xac dinh loai giao dich tu loai danh muc.
     */
    private TransactionType resolveTransactionType(RecurringTransaction recurring) {
        CategoryType categoryType = recurring.getCategory() != null ? recurring.getCategory().getType() : null;
        if (categoryType == null) {
            throw new IllegalStateException("Category type is required for recurring transaction " + recurring.getId());
        }

        return switch (categoryType) {
            case INCOME -> TransactionType.INCOME;
            case EXPENSE -> TransactionType.EXPENSE;
            case FINANCE -> TransactionType.SAVING;
        };
    }

    /**
     * Tao marker de danh dau giao dich auto.
     */
    private String buildExecutionMarker(Long recurringId, LocalDate date) {
        return "[" + AUTO_MARKER_PREFIX + "#" + recurringId + "#" + date + "]";
    }

    /**
     * Hop nhat note/title kem marker de de truy vet.
     */
    private String buildNote(RecurringTransaction recurring, String marker) {
        String title = StringUtils.hasText(recurring.getTitle()) ? recurring.getTitle().trim() : "";
        String note = StringUtils.hasText(recurring.getNote()) ? recurring.getNote().trim() : "";

        if (!title.isEmpty() && !note.isEmpty()) {
            return marker + " " + title + " - " + note;
        }
        if (!title.isEmpty()) {
            return marker + " " + title;
        }
        if (!note.isEmpty()) {
            return marker + " " + note;
        }
        return marker;
    }
}
