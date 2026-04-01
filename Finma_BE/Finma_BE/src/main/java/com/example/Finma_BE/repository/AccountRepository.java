package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    List<Account> findByUser_Id(Long userId);

    Optional<Account> findByIdAndUserId(Long id, Long userId);
}
