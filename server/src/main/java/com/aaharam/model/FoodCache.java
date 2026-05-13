package com.aaharam.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "food_cache")
public class FoodCache {

    @Id
    @Column(name = "barcode")
    private String barcode;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "brand")
    private String brand;

    @Column(name = "calories_per_100g")
    private BigDecimal caloriesPer100g;

    @Column(name = "protein_per_100g")
    private BigDecimal proteinPer100g;

    @Column(name = "carbs_per_100g")
    private BigDecimal carbsPer100g;

    @Column(name = "fat_per_100g")
    private BigDecimal fatPer100g;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "fetched_at")
    private OffsetDateTime fetchedAt;
}
