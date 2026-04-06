package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Goal;
import com.example.Finma_BE.enums.GoalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
<<<<<<< HEAD
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {

    List<Goal> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Goal> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, GoalStatus status);

    Optional<Goal> findByIdAndUserId(Long id, Long userId);
=======
public interface GoalRepository extends JpaRepository<Goal,Long> {
    List<Goal> findAllByUserIdAndStatus(Long userId, GoalStatus status);
>>>>>>> deae13cc60cb03378d8e33da1fe49c684f8f51d5
}
