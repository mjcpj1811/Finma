package com.example.Finma_BE.repository;


import com.example.Finma_BE.entity.Goal;
import com.example.Finma_BE.enums.GoalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface GoalRepository extends JpaRepository<Goal,Long> {
    List<Goal> findAllByUserIdAndStatus(Long userId, GoalStatus status);
}
