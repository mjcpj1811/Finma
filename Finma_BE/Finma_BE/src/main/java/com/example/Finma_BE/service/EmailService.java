package com.example.Finma_BE.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService{

    private final JavaMailSender mailSender;

    public void sendResetPasswordEmail(String to, String token) {

        // String resetLink = "http://localhost:8081/reset-password?token=" + token;
// Dùng exp:// link cho Expo Go testing
        // Production: đổi thành finma://reset-password?token= hoặc HTTPS domain
        String resetLink = "exp://192.168.1.66:8081/--/reset-password?token=" + token;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Reset your password");
        message.setText(
                "Click the link below to reset your password:\n\n" +
                        resetLink +
                        "\n\nThis link will expire in 1 hour."
        );

        mailSender.send(message);
    }
}