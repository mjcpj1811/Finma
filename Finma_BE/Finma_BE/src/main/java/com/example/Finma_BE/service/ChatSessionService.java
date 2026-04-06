package com.example.Finma_BE.service;

import com.example.Finma_BE.entity.ChatSession;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ChatSessionService {

    ChatSessionRepository sessionRepository;

    public ChatSession findChatSessionById(Long sessionId) {
        return sessionRepository.findChatSessionById(sessionId);
    }

    public void saveChatSession(ChatSession chatSession) {
        sessionRepository.save(chatSession);
    }

    public List<ChatSession> getSessionsByUserId(Long userId) {
        return sessionRepository.findAllByUserId(userId);
    }

    public Long createSession(User user) {
        ChatSession session = new ChatSession();
        session.setUser(user);
        sessionRepository.save(session);
        return session.getId();
    }

    public List<ChatSession> getUserSessions(Long userId) {
        return sessionRepository.findAllByUserId(userId);
    }
}
