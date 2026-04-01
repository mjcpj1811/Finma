package com.example.Finma_BE.service;

import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.exception.ApiException;
import com.example.Finma_BE.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthContext {
    private final UserRepository userRepository;

    public User requireCurrentUser() {
        var context = SecurityContextHolder.getContext();
        var username = context.getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Unauthenticated access"));
    }
}
