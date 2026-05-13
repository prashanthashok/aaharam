package com.aaharam.service;

import com.aaharam.dto.FoodDto;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenFoodFactsService {

    private static final String BARCODE_URL =
            "https://world.openfoodfacts.org/api/v0/product/{barcode}.json";
    private static final String SEARCH_URL =
            "https://world.openfoodfacts.org/cgi/search.pl"
            + "?search_terms={query}&json=1"
            + "&fields=code,product_name,brands,nutriments,image_url&page_size=10";

    private final RestTemplate restTemplate;

    public FoodDto fetchByBarcode(String barcode) {
        @SuppressWarnings("unchecked")
        Map<String, Object> body = restTemplate.getForObject(BARCODE_URL, Map.class, barcode);

        if (body == null || !Integer.valueOf(1).equals(body.get("status"))) {
            throw new EntityNotFoundException("Product not found for barcode: " + barcode);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> product = (Map<String, Object>) body.get("product");
        return mapProduct(barcode, product);
    }

    public List<FoodDto> searchByQuery(String query) {
        @SuppressWarnings("unchecked")
        Map<String, Object> body = restTemplate.getForObject(SEARCH_URL, Map.class, query);

        if (body == null) return List.of();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> products = (List<Map<String, Object>>) body.get("products");
        if (products == null) return List.of();

        List<FoodDto> results = new ArrayList<>();
        for (Map<String, Object> product : products) {
            String name = (String) product.get("product_name");
            if (name == null || name.isBlank()) continue;
            String code = (String) product.get("code");
            results.add(mapProduct(code, product));
        }
        return results;
    }

    @SuppressWarnings("unchecked")
    private FoodDto mapProduct(String barcode, Map<String, Object> product) {
        Map<String, Object> nutriments = (Map<String, Object>) product.getOrDefault("nutriments", Map.of());

        return new FoodDto(
                barcode,
                (String) product.get("product_name"),
                (String) product.get("brands"),
                toBigDecimal(nutriments.get("energy-kcal_100g")),
                toBigDecimal(nutriments.get("proteins_100g")),
                toBigDecimal(nutriments.get("carbohydrates_100g")),
                toBigDecimal(nutriments.get("fat_100g")),
                (String) product.get("image_url")
        );
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
