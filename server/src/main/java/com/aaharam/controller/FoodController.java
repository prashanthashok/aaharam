package com.aaharam.controller;

import com.aaharam.dto.FoodDto;
import com.aaharam.service.FoodService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/food")
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    @GetMapping("/barcode/{barcode}")
    public FoodDto getByBarcode(@PathVariable String barcode) {
        return foodService.getByBarcode(barcode);
    }

    @GetMapping("/search")
    public List<FoodDto> search(@RequestParam("q") String query) {
        return foodService.search(query);
    }
}
