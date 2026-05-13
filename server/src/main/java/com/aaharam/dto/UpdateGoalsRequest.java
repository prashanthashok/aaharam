package com.aaharam.dto;

import jakarta.validation.constraints.Positive;

public record UpdateGoalsRequest(

        @Positive
        int calories,

        @Positive
        int proteinG,

        @Positive
        int carbsG,

        @Positive
        int fatG
) {}
