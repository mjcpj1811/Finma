package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;


public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {
}
