package com.aaharam.repository;

import com.aaharam.model.FoodCache;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodCacheRepository extends JpaRepository<FoodCache, String> {
}
