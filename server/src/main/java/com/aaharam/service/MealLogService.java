package com.aaharam.service;

import com.aaharam.dto.CreateMealLogRequest;
import com.aaharam.dto.MealLogDto;
import com.aaharam.model.MealLog;
import com.aaharam.repository.MealLogRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MealLogService {

    private static final List<String> MEAL_ORDER = List.of("breakfast", "lunch", "dinner", "snack");

    private final MealLogRepository mealLogRepository;

    public MealLogDto logMeal(UUID userId, CreateMealLogRequest req) {
        MealLog log = new MealLog(
                null,
                userId,
                req.loggedDate() != null ? req.loggedDate() : LocalDate.now(),
                req.mealType(),
                req.foodName(),
                req.brand(),
                req.servingG(),
                req.calories(),
                req.proteinG(),
                req.carbsG(),
                req.fatG(),
                req.barcode(),
                OffsetDateTime.now()
        );
        MealLog saved = mealLogRepository.save(log);
        return toDto(saved);
    }

    public Map<String, List<MealLogDto>> getLogsForDate(UUID userId, LocalDate date) {
        List<MealLog> logs = mealLogRepository.findByUserIdAndLoggedDateOrderByCreatedAtAsc(userId, date);

        Map<String, List<MealLogDto>> grouped = new LinkedHashMap<>();
        for (String meal : MEAL_ORDER) {
            grouped.put(meal, logs.stream()
                    .filter(l -> meal.equals(l.getMealType()))
                    .map(this::toDto)
                    .toList());
        }
        return grouped;
    }

    @Transactional
    public void deleteLog(UUID userId, UUID logId) {
        if (!mealLogRepository.existsByIdAndUserId(logId, userId)) {
            throw new EntityNotFoundException("Log entry not found");
        }
        mealLogRepository.deleteByIdAndUserId(logId, userId);
    }

    private MealLogDto toDto(MealLog e) {
        return new MealLogDto(
                e.getId(), e.getMealType(), e.getFoodName(), e.getBrand(),
                e.getServingG(), e.getCalories(), e.getProteinG(),
                e.getCarbsG(), e.getFatG(), e.getBarcode(), e.getLoggedDate()
        );
    }
}
