package com.example.Finma_BE.service;

import com.example.Finma_BE.entity.ChatMessage;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String API_KEY = "AIzaSyAnRfctDoh0EGyyrvwawsazdrPcH4i08T8";

    public String callGemini(List<ChatMessage> chatHistory, String userContext) {

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

        String systemPrompt = """
                Bạn là một chuyên gia tư vấn tài chính cá nhân.
                Trả lời ngắn gọn, rõ ràng, dễ hiểu.
                Đưa ra lời khuyên thực tế, tránh lan man.
                Luôn trả lời bằng tiếng Việt nếu người dùng dùng tiếng Việt.
                Luôn kết thúc câu hoàn chỉnh, không bị dang dở.
                """ + "\n\nThông tin tài chính của người dùng:\n" + userContext;

        List<Map<String, Object>> contents = new ArrayList<>();

        // system prompt (fake system role)
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", systemPrompt))
        ));

        contents.add(Map.of(
                "role", "model",
                "parts", List.of(Map.of("text", "OK"))
        ));

        // chat history
        for (ChatMessage message : chatHistory) {
            contents.add(Map.of(
                    "role", message.getRole().equals("user") ? "user" : "model",
                    "parts", List.of(Map.of("text", message.getContent()))
            ));
        }

        Map<String, Object> body = Map.of(
                "contents", contents,
                "generationConfig", Map.of(
                        "maxOutputTokens", 600,
                        "temperature", 0.6
                )
        );

        try {
            String responseJson = restTemplate.postForObject(url, body, String.class);
            JsonNode root = objectMapper.readTree(responseJson);

            JsonNode parts = root.path("candidates").get(0)
                    .path("content").path("parts");

            StringBuilder result = new StringBuilder();

            for (JsonNode part : parts) {
                result.append(part.path("text").asText());
            }

            System.out.println(result);

            return result.toString();

//            JsonNode candidates = root.path("candidates");

//            if (candidates.isEmpty()) {
//                return "Không nhận được phản hồi từ AI.";
//            }
//
//            return candidates.get(0)
//                    .path("content")
//                    .path("parts")
//                    .get(0)
//                    .path("text")
//                    .asText();

        } catch (Exception e) {
            e.printStackTrace(); // debug log
            return "Xin lỗi, hệ thống AI đang gặp lỗi.";
        }
    }
}