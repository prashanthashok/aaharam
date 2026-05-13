package com.aaharam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.aaharam.config.SupabaseProperties;

@SpringBootApplication
@EnableConfigurationProperties(SupabaseProperties.class)
public class AaharamApplication {
    public static void main(String[] args) {
        SpringApplication.run(AaharamApplication.class, args);
    }
}
