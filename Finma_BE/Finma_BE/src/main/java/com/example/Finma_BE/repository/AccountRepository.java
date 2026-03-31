package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account,Long> {
  Optional<Account> findByIdAndUserId(Long id, Long userId);
}
