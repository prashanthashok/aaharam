package com.nutriscan;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.nutriscan.config.SupabaseProperties;

@SpringBootApplication
@EnableConfigurationProperties(SupabaseProperties.class)
public class NutriscanApplication {
    public static void main(String[] args) {
        SpringApplication.run(NutriscanApplication.class, args);
    }
}
