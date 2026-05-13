package com.nutriscan.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("No authenticated user in security context");
        }
        return (String) auth.getPrincipal();
    }
}
