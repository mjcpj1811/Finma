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

    @ManyToOne
    private User user;

    @ManyToOne
    private Category category;
}