package com.example.Finma_BE.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chat_sessions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;
}