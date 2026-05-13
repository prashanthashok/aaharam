package com.aaharam.repository;

import com.aaharam.model.DailyGoals;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DailyGoalsRepository extends JpaRepository<DailyGoals, UUID> {

    Optional<DailyGoals> findByUserId(UUID userId);
}
