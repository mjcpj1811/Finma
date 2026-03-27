package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage,Long> {
}
