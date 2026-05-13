package com.aaharam.controller;

import com.aaharam.dto.DailyGoalsDto;
import com.aaharam.dto.UpdateGoalsRequest;
import com.aaharam.service.DailyGoalsService;
import com.aaharam.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class DailyGoalsController {

    private final DailyGoalsService dailyGoalsService;

    @GetMapping
    public DailyGoalsDto getGoals() {
        UUID userId = UUID.fromString(SecurityUtils.getCurrentUserId());
        return dailyGoalsService.getGoals(userId);
    }

    @PutMapping
    public DailyGoalsDto updateGoals(@RequestBody @Valid UpdateGoalsRequest req) {
        UUID userId = UUID.fromString(SecurityUtils.getCurrentUserId());
        return dailyGoalsService.upsertGoals(userId, req);
    }
}
