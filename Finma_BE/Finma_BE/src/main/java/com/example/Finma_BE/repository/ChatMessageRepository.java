package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage,Long> {
    // Lấy lịch sử chat của một session để gửi cho AI (Multi-turn)
    List<ChatMessage> findAllBySessionIdOrderByCreatedAtAsc(Long sessionId);
}
