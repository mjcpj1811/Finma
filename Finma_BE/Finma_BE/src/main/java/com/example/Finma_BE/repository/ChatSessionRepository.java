package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;


public interface ChatSessionRepository extends JpaRepository<ChatSession,Long> {
    List<ChatSession> findAllByUserId(Long userId);

    ChatSession findChatSessionById(Long id);
}
