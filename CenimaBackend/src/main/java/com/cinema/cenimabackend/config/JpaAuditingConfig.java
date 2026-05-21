package com.cinema.cenimabackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

@Configuration
public class JpaAuditingConfig {

    @Bean
    public AuditorAware<UUID> auditorProvider() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()
                    || auth.getPrincipal().equals("anonymousUser")) {
                return Optional.empty();
            }
            try {
                return Optional.of(UUID.fromString(auth.getPrincipal().toString()));
            } catch (Exception e) {
                return Optional.empty();
            }
        };
    }
}