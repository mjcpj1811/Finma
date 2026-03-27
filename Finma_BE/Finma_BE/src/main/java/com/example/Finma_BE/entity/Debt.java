package com.example.Finma_BE.entity;

import com.example.Finma_BE.enums.DebtStatus;
import com.example.Finma_BE.enums.DebtType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "debts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Debt extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String personName;

    @Enumerated(EnumType.STRING)
    private DebtType type;

    private BigDecimal totalAmount;
    private BigDecimal interestRate;

    private LocalDate startDate;
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    private DebtStatus status;

    @ManyToOne
    private User user;
}