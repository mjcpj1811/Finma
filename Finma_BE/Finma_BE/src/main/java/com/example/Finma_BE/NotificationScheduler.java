package com.example.Finma_BE.finance;

import com.example.Finma_BE.entity.Goal;
import com.example.Finma_BE.enums.GoalStatus;
import com.example.Finma_BE.enums.NotificationType;
import com.example.Finma_BE.repository.GoalRepository;
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

    GoalRepository      goalRepository;
    NotificationService notificationService;

    /**
     * Chạy mỗi ngày lúc 08:00 sáng.
     * Cron: "0 0 8 * * *"
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void checkGoalDeadlines() {
        LocalDate today = LocalDate.now();
        log.info("[NotificationScheduler] Checking goal deadlines on {}", today);

        // Lấy tất cả goal đang IN_PROGRESS
        List<Goal> activeGoals = goalRepository.findAll()
                .stream()
                .filter(g -> g.getStatus() == GoalStatus.IN_PROGRESS)
                .toList();

        int notified = 0;
        for (Goal goal : activeGoals) {
            long daysLeft = ChronoUnit.DAYS.between(today, goal.getEndDate());

            // Gửi cảnh báo nếu còn ≤ 7 ngày
            if (daysLeft >= 0 && daysLeft <= 7) {
                notificationService.createNotification(
                        goal.getUser(),
                        NotificationType.GOAL_DEADLINE_NEAR,
                        "⏰ Sắp đến hạn mục tiêu tiết kiệm!",
                        String.format("Mục tiêu '%s' còn %d ngày nữa đến deadline (%s). "
                                + "Hãy nạp thêm tiền để đạt mục tiêu!",
                                goal.getName(), daysLeft, goal.getEndDate()),
                        goal.getId(), "GOAL"
                );
                notified++;
            }
        }

        log.info("[NotificationScheduler] Sent {} deadline notifications", notified);
    }
}
