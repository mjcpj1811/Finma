package com.example.Finma_BE.dto.response;

import lombok.Data;

@Data
public class ChatResponse {
    private String answer;

    public ChatResponse(String answer) {
        this.answer = answer;
    }
}