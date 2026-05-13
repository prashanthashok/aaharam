package com.aaharam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateMealLogRequest(

        @NotBlank
        @Pattern(
            regexp = "breakfast|lunch|dinner|snack",
            message = "must be one of: breakfast, lunch, dinner, snack"
        )
        String mealType,

        @NotBlank
        String foodName,

        String brand,

        @NotNull @Positive
        BigDecimal servingG,

        @NotNull @PositiveOrZero
        BigDecimal calories,

        @NotNull @PositiveOrZero
        BigDecimal proteinG,

        @NotNull @PositiveOrZero
        BigDecimal carbsG,

        @NotNull @PositiveOrZero
        BigDecimal fatG,

        String barcode,

        LocalDate loggedDate
) {}
