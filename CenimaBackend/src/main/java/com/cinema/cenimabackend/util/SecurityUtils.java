package com.cinema.cenimabackend.util;

import com.cinema.cenimabackend.exception.ForbiddenException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            throw new ForbiddenException("Bạn chưa đăng nhập");
        try {
            return UUID.fromString(auth.getPrincipal().toString());
        } catch (Exception e) {
            throw new ForbiddenException("Không xác định được người dùng");
        }
    }

    public static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(role));
    }
}