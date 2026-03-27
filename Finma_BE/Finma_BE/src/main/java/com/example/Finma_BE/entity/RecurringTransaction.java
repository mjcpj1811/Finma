package com.example.Finma_BE.entity;

import com.example.Finma_BE.enums.Frequency;
import com.example.Finma_BE.enums.RecurringStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "recurring_transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurringTransaction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal amount;
    private String title;
    private String note;

    @Enumerated(EnumType.STRING)
    private Frequency frequency;

    private Integer dayOfMonth;
    private Integer dayOfWeek;

    private LocalDate startDate;

    private Integer reminderDaysBefore;
    private Boolean isActive;

    @Enumerated(EnumType.STRING)
    private RecurringStatus status;

    @ManyToOne
    private User user;

    @ManyToOne
    private Account account;

    @ManyToOne
    private Category category;
}