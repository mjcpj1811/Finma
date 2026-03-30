package com.example.Finma_BE.finance.repository;

import com.example.Finma_BE.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FinanceUserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}

