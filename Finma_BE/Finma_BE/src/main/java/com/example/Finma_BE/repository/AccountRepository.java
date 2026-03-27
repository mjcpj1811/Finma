package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account,Long> {
}
