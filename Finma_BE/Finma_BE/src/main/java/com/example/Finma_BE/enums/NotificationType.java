package com.example.Finma_BE.enums;

public enum NotificationType {
    // Ngân sách
    BUDGET_WARNING,       // Chi tiêu đạt 80% hạn mức
    BUDGET_EXCEEDED,      // Chi tiêu vượt 100% hạn mức
    BUDGET_CREATED,       // Ngân sách mới được sinh tự động (recurring)

    // Mục tiêu tiết kiệm
    GOAL_COMPLETED,       // Đạt 100% mục tiêu
    GOAL_DEADLINE_NEAR,   // Còn ≤ 7 ngày đến deadline mà chưa đạt
    GOAL_DEPOSIT_ADDED    // Nạp tiền thành công vào mục tiêu
}
