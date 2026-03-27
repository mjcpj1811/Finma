package com.example.Finma_BE.entity;

import com.example.Finma_BE.entity.BaseEntity;
import com.example.Finma_BE.enums.AccountType;
import jakarta.persistence.*;
import lombok.*;


import java.math.BigDecimal;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Account extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    private AccountType type;

    private BigDecimal balance;

    private String icon;
    private String color;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}