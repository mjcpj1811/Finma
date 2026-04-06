package com.example.Finma_BE.dto.request;

import lombok.Data;

@Data
public class ChatRequest {
    private Long sessionId;
    private String question;
}
