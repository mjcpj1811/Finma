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

        String resetLink = "http://localhost:3000/reset-password?token=" + token;

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