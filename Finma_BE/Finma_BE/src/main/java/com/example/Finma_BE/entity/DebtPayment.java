package com.example.Finma_BE.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "debt_payments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtPayment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal amount;
    private LocalDate paymentDate;

    @ManyToOne
    @JoinColumn(name = "debt_id")
    private Debt debt;
}