package com.aaharam.repository;

import com.aaharam.model.MealLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface MealLogRepository extends JpaRepository<MealLog, UUID> {

    List<MealLog> findByUserIdAndLoggedDateOrderByCreatedAtAsc(UUID userId, LocalDate date);

    void deleteByIdAndUserId(UUID id, UUID userId);

    boolean existsByIdAndUserId(UUID id, UUID userId);
}
