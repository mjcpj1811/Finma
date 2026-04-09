package com.example.Finma_BE.util;

import com.example.Finma_BE.entity.Debt;
import com.example.Finma_BE.entity.Goal;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.enums.DebtStatus;
import com.example.Finma_BE.enums.GoalStatus;
import com.example.Finma_BE.enums.NotificationType;
import com.example.Finma_BE.repository.DebtRepository;
import com.example.Finma_BE.repository.GoalRepository;
import com.example.Finma_BE.repository.TransactionRepository;
import com.example.Finma_BE.repository.UserRepository;
import com.example.Finma_BE.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduler kiểm tra deadline mục tiêu tiết kiệm mỗi ngày lúc 08:00 sáng.
 * Gửi thông báo GOAL_DEADLINE_NEAR nếu còn ≤ 7 ngày mà chưa hoàn thành.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class NotificationScheduler {

    GoalRepository goalRepository;
    DebtRepository debtRepository;
    UserRepository userRepository;
    TransactionRepository transactionRepository;
    NotificationService notificationService;

    /**
     * Chạy mỗi ngày lúc 08:00 sáng.
     * Cron: "0 0 8 * * *"
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void checkGoalDeadlines() {
        LocalDate today = LocalDate.now();
        log.info("[NotificationScheduler] Checking goal deadlines on {}", today);

        List<Goal> activeGoals = goalRepository.findAll()
                .stream()
                .filter(g -> g.getStatus() == GoalStatus.IN_PROGRESS)
                .toList();

        int notified = 0;
        for (Goal goal : activeGoals) {
            if (goal.getEndDate() == null)
                continue;
            long daysLeft = ChronoUnit.DAYS.between(today, goal.getEndDate());

            if (daysLeft >= 0 && daysLeft <= 7) {
                notificationService.createNotification(
                        goal.getUser(),
                        NotificationType.GOAL_DEADLINE_NEAR,
                        "⏰ Sắp đến hạn mục tiêu tiết kiệm!",
                        String.format(
                                "Mục tiêu '%s' còn %d ngày nữa đến deadline (%s). Hãy nạp thêm tiền để đạt mục tiêu!",
                                goal.getName(), daysLeft, goal.getEndDate()),
                        goal.getId(), "GOAL");
                notified++;
            }
        }
        log.info("[NotificationScheduler] Sent {} goal deadline notifications", notified);
    }

    /**
     * Chạy mỗi ngày lúc 08:30 sáng.
     * Kiểm tra các khoản nợ sắp đến hạn.
     */
    @Scheduled(cron = "0 30 8 * * *")
    public void checkDebtDeadlines() {
        LocalDate today = LocalDate.now();
        log.info("[NotificationScheduler] Checking debt deadlines on {}", today);

        List<Debt> activeDebts = debtRepository.findAll()
                .stream()
                .filter(d -> d.getStatus() == DebtStatus.ONGOING || d.getStatus() == DebtStatus.OVERDUE)
                .toList();

        int notified = 0;
        for (Debt debt : activeDebts) {
            if (debt.getDueDate() == null)
                continue;
            long daysLeft = ChronoUnit.DAYS.between(today, debt.getDueDate());

            if (daysLeft >= 0 && daysLeft <= 7) {
                notificationService.createNotification(
                        debt.getUser(),
                        NotificationType.DEBT_REMINDER,
                        "💸 Nhắc nhở khoản nợ sắp đến hạn",
                        String.format("Khoản nợ với '%s' còn %d ngày nữa đến hạn thanh toán (%s). Đừng quên xử lý nhé!",
                                debt.getPersonName(), daysLeft, debt.getDueDate()),
                        debt.getId(), "DEBT");
                notified++;
            }
        }
        log.info("[NotificationScheduler] Sent {} debt deadline notifications", notified);
    }

    /**
     * Chạy mỗi ngày lúc 08:00 tối.
     * Nhắc nhở người dùng nhập giao dịch nếu hôm nay chưa có giao dịch nào.
     */
    @Scheduled(cron = "0 0 20 * * *")
    public void sendDailyEntryReminder() {
        LocalDate today = LocalDate.now();
        log.info("[NotificationScheduler] Sending daily entry reminders on {}", today);

        List<User> users = userRepository.findAll();
        int notified = 0;

        for (User user : users) {
            // Kiểm tra xem hôm nay user đã có giao dịch nào chưa
            boolean hasTransactionsToday = transactionRepository.existsByUserIdAndDate(user.getId(), today);

            if (!hasTransactionsToday) {
                notificationService.createNotification(
                        user,
                        NotificationType.DAILY_REMINDER,
                        "📝 Đừng quên nhập giao dịch hôm nay!",
                        "Bạn chưa ghi nhận khoản thu chi nào cho hôm nay. Hãy dành 1 phút để cập nhật nhé!",
                        null, null);
                notified++;
            }
        }
        log.info("[NotificationScheduler] Sent {} daily entry reminders", notified);
    }

    @Scheduled(cron = "0 0 7 * * *")
    public void sendDailyGreeting() {
        log.info("[NotificationScheduler] Sending daily greetings");
        List<User> users = userRepository.findAll();
        int notified = 0;

        for (User user : users) {
            // Nếu hôm nay chưa nhận được lời chào (DAILY_GREETING)
            if (!notificationService.hasReceivedTypeToday(user.getId(), NotificationType.DAILY_GREETING)) {
                notificationService.createNotification(
                        user,
                        NotificationType.DAILY_GREETING,
                        "☀️ Chào buổi sáng!",
                        String.format("Chúc %s một ngày mới tốt lành và quản lý tài chính hiệu quả cùng Finma nhé!",
                                user.getFullName() != null ? user.getFullName() : user.getUsername()),
                        null, null
                );
                notified++;
            }
        }
        log.info("[NotificationScheduler] Sent {} daily greetings", notified);
    }
}
