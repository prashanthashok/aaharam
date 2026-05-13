package com.aaharam.service;

import com.aaharam.dto.FoodDto;
import com.aaharam.model.FoodCache;
import com.aaharam.repository.FoodCacheRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FoodService {

    private static final int CACHE_TTL_DAYS = 30;

    private final FoodCacheRepository foodCacheRepository;
    private final OpenFoodFactsService openFoodFactsService;

    public FoodDto getByBarcode(String barcode) {
        Optional<FoodCache> cached = foodCacheRepository.findById(barcode);

        if (cached.isPresent()) {
            FoodCache entry = cached.get();
            if (entry.getFetchedAt() != null &&
                    entry.getFetchedAt().isAfter(OffsetDateTime.now().minusDays(CACHE_TTL_DAYS))) {
                return toDto(entry);
            }
        }

        FoodDto dto = openFoodFactsService.fetchByBarcode(barcode);
        foodCacheRepository.save(toEntity(dto));
        return dto;
    }

    public List<FoodDto> search(String query) {
        return openFoodFactsService.searchByQuery(query);
    }

    private FoodDto toDto(FoodCache e) {
        return new FoodDto(e.getBarcode(), e.getName(), e.getBrand(),
                e.getCaloriesPer100g(), e.getProteinPer100g(),
                e.getCarbsPer100g(), e.getFatPer100g(), e.getImageUrl());
    }

    private FoodCache toEntity(FoodDto dto) {
        return new FoodCache(
                dto.barcode(), dto.name(), dto.brand(),
                nullSafe(dto.caloriesPer100g()),
                nullSafe(dto.proteinPer100g()),
                nullSafe(dto.carbsPer100g()),
                nullSafe(dto.fatPer100g()),
                dto.imageUrl(),
                OffsetDateTime.now()
        );
    }

    private BigDecimal nullSafe(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
