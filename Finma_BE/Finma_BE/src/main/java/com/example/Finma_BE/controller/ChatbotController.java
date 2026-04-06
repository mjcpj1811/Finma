package com.example.Finma_BE.controller;

import com.example.Finma_BE.dto.request.ChatRequest;
import com.example.Finma_BE.dto.response.ChatResponse;
import com.example.Finma_BE.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/ask")
    public ChatResponse ask(@RequestBody ChatRequest request) {
        return chatbotService.ask(request);
    }
}