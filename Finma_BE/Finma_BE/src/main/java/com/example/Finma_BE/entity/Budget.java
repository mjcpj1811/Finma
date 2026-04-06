package com.example.Finma_BE.entity;

import com.example.Finma_BE.enums.PeriodType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "budgets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Budget extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal amountLimit;

    @Enumerated(EnumType.STRING)
    private PeriodType periodType;

    private LocalDate startDate;
    private LocalDate endDate;

<<<<<<< HEAD
    /**
     * true  → budget sẽ được tự động sinh lại vào ngày 1 hàng tháng
     * false → budget 1 lần, không tự lặp
     */
    @Column(name = "is_recurring", nullable = false)
    @Builder.Default
    private Boolean isRecurring = false;

    /**
     * ID của budget gốc (tháng đầu tiên người dùng tạo).
     * Các budget sinh tự động sau này sẽ trỏ về budget gốc đó.
     * null → đây là budget gốc.
     */
    @Column(name = "parent_budget_id")
    private Long parentBudgetId;

    @ManyToOne
=======
    @ManyToOne(fetch = FetchType.LAZY)
>>>>>>> deae13cc60cb03378d8e33da1fe49c684f8f51d5
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    private Category category;
}