package com.example.Finma_BE.dto.response;

import com.example.Finma_BE.enums.NotificationType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationResponse {

    Long id;
    String title;
    String content;
    NotificationType type;

    /** ID của Budget/Goal liên quan */
    Long referenceId;
    /** "BUDGET" hoặc "GOAL" */
    String referenceType;

    Boolean isRead;
    LocalDateTime createdAt;
}
