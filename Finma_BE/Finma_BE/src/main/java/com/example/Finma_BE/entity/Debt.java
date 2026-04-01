package com.example.Finma_BE.entity;

import com.example.Finma_BE.enums.DebtStatus;
import com.example.Finma_BE.enums.DebtType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

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
    private String note;

    @Enumerated(EnumType.STRING)
    private DebtStatus status;

    @OneToMany(mappedBy = "debt", fetch = FetchType.LAZY)
    private List<DebtPayment> payments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}