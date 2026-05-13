package com.aaharam.service;

import com.aaharam.dto.DailyGoalsDto;
import com.aaharam.dto.UpdateGoalsRequest;
import com.aaharam.model.DailyGoals;
import com.aaharam.repository.DailyGoalsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DailyGoalsService {

    private static final DailyGoalsDto DEFAULTS = new DailyGoalsDto(2000, 150, 200, 65);

    private final DailyGoalsRepository dailyGoalsRepository;

    public DailyGoalsDto getGoals(UUID userId) {
        return dailyGoalsRepository.findByUserId(userId)
                .map(this::toDto)
                .orElse(DEFAULTS);
    }

    public DailyGoalsDto upsertGoals(UUID userId, UpdateGoalsRequest req) {
        DailyGoals entity = dailyGoalsRepository.findByUserId(userId)
                .orElseGet(() -> new DailyGoals(null, userId, 0, 0, 0, 0, null));

        entity.setCalories(req.calories());
        entity.setProteinG(req.proteinG());
        entity.setCarbsG(req.carbsG());
        entity.setFatG(req.fatG());
        entity.setUpdatedAt(OffsetDateTime.now());

        return toDto(dailyGoalsRepository.save(entity));
    }

    private DailyGoalsDto toDto(DailyGoals e) {
        return new DailyGoalsDto(e.getCalories(), e.getProteinG(), e.getCarbsG(), e.getFatG());
    }
}
