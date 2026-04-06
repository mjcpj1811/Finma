package com.example.Finma_BE.service;

import com.example.Finma_BE.entity.ChatMessage;
import com.example.Finma_BE.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ChatMessageService {

    ChatMessageRepository chatMessageRepository;

    public void saveChatMessage(ChatMessage chatMessage) {
        chatMessageRepository.save(chatMessage);
    }

    public List<ChatMessage> getChatHistory(Long sessionId) {
        return chatMessageRepository.findAllBySessionIdOrderByCreatedAtAsc(sessionId);
    }
}
