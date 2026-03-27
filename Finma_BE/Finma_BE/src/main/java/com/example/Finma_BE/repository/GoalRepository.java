package com.example.Finma_BE.repository;


import com.example.Finma_BE.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoalRepository extends JpaRepository<Goal,Long> {
}
