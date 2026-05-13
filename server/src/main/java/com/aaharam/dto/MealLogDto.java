package com.aaharam.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record MealLogDto(
        UUID id,
        String mealType,
        String foodName,
        String brand,
        BigDecimal servingG,
        BigDecimal calories,
        BigDecimal proteinG,
        BigDecimal carbsG,
        BigDecimal fatG,
        String barcode,
        LocalDate loggedDate
) {}
