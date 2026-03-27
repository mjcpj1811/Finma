package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatSessionRepository extends JpaRepository<ChatSession,Long> {
}
