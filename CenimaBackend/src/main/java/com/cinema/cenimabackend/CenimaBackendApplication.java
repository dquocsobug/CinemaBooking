package com.cinema.cenimabackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@EnableJpaAuditing
@EnableScheduling
@SpringBootApplication
public class CenimaBackendApplication {

    public static void main(String[] args) {

        SpringApplication.run(CenimaBackendApplication.class, args);

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String rawPassword = "123456";

        // Generate hash
        String hash = encoder.encode(rawPassword);

        System.out.println("=================================");
        System.out.println("Raw password: " + rawPassword);
        System.out.println("BCrypt hash: " + hash);

        // Verify
        boolean matches = encoder.matches(rawPassword, hash);

        System.out.println("Password matches: " + matches);
        System.out.println("=================================");
    }
}