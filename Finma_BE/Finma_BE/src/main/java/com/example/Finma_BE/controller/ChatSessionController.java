package com.example.Finma_BE.controller;

import com.example.Finma_BE.entity.ChatSession;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.service.ChatSessionService;
import com.example.Finma_BE.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/chat-sessions")
@RequiredArgsConstructor
public class ChatSessionController {

    private final ChatSessionService chatSessionService;
    private final UserService userService;

    @PostMapping
    public Long createSession() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        return chatSessionService.createSession(user);
    }

    @GetMapping
    public List<ChatSession> getUserSessions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userService.findByUsername(email);
        Long userId = user.getId();
        return chatSessionService.getUserSessions(userId);
    }
}
