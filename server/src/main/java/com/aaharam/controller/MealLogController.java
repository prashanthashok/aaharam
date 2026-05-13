package com.aaharam.controller;

import com.aaharam.dto.CreateMealLogRequest;
import com.aaharam.dto.MealLogDto;
import com.aaharam.service.MealLogService;
import com.aaharam.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/log")
@RequiredArgsConstructor
public class MealLogController {

    private final MealLogService mealLogService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MealLogDto create(@RequestBody @Valid CreateMealLogRequest req) {
        UUID userId = UUID.fromString(SecurityUtils.getCurrentUserId());
        return mealLogService.logMeal(userId, req);
    }

    @GetMapping
    public Map<String, List<MealLogDto>> getForDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        UUID userId = UUID.fromString(SecurityUtils.getCurrentUserId());
        return mealLogService.getLogsForDate(userId, date);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        UUID userId = UUID.fromString(SecurityUtils.getCurrentUserId());
        mealLogService.deleteLog(userId, id);
    }
}
