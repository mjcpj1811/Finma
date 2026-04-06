<<<<<<< HEAD
package com.example.Finma_BE.entity;

import com.example.Finma_BE.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    /** ID của đối tượng liên quan (budgetId hoặc goalId) */
    private Long referenceId;

    /** Loại đối tượng: "BUDGET" hoặc "GOAL" */
    private String referenceType;

    @Builder.Default
    private Boolean isRead = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
=======
package com.example.Finma_BE.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String content;
    private String type;

    private Boolean isRead;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;
}
>>>>>>> deae13cc60cb03378d8e33da1fe49c684f8f51d5
