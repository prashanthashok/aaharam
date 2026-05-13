package com.aaharam.dto;

import java.math.BigDecimal;

public record FoodDto(
        String barcode,
        String name,
        String brand,
        BigDecimal caloriesPer100g,
        BigDecimal proteinPer100g,
        BigDecimal carbsPer100g,
        BigDecimal fatPer100g,
        String imageUrl
) {}
