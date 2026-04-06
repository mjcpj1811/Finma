<<<<<<< HEAD
package com.example.Finma_BE.entity;

import com.example.Finma_BE.enums.GoalStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "goals")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Goal extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    private BigDecimal targetAmount;

    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate completedAt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private GoalStatus status = GoalStatus.IN_PROGRESS;

    private String icon;
    private String color;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}

=======
package com.example.Finma_BE.entity;

import com.example.Finma_BE.enums.GoalStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "goals")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Goal extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private BigDecimal targetAmount;

    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate completedAt;

    @Enumerated(EnumType.STRING)
    private GoalStatus status;

    private String icon;
    private String color;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
>>>>>>> deae13cc60cb03378d8e33da1fe49c684f8f51d5
