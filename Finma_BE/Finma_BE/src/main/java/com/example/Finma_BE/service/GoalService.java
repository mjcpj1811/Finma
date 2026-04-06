package com.example.Finma_BE.service;

import com.example.Finma_BE.entity.Goal;
import com.example.Finma_BE.enums.GoalStatus;
import com.example.Finma_BE.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class GoalService {

    GoalRepository goalRepository;

    public List<Goal> getActiveGoalsByUserId(Long userId) {
        return goalRepository.findAllByUserIdAndStatus(userId, GoalStatus.IN_PROGRESS);
    }
}