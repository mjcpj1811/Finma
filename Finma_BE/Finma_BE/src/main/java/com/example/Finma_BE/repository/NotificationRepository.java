package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification,Long> {
}
