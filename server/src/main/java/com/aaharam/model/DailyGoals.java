package com.aaharam.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "daily_goals")
public class DailyGoals {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "calories", nullable = false)
    private int calories;

    @Column(name = "protein_g", nullable = false)
    private int proteinG;

    @Column(name = "carbs_g", nullable = false)
    private int carbsG;

    @Column(name = "fat_g", nullable = false)
    private int fatG;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
