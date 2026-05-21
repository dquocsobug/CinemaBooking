package com.cinema.cenimabackend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Configuration
public class KeepAliveConfig {

    // Đổi thành backend render của bạn
    private static final String RENDER_URL =
            "https://your-backend.onrender.com/actuator/health";

    @PostConstruct
    public void keepAlive() {

        Executors.newSingleThreadScheduledExecutor()
                .scheduleAtFixedRate(() -> {

                    try {

                        HttpURLConnection connection =
                                (HttpURLConnection) new URL(RENDER_URL).openConnection();

                        connection.setRequestMethod("GET");
                        connection.setConnectTimeout(5000);
                        connection.setReadTimeout(5000);

                        int responseCode = connection.getResponseCode();

                        System.out.println("KeepAlive ping: " + responseCode);

                    } catch (Exception e) {

                        System.out.println("KeepAlive error: " + e.getMessage());

                    }

                }, 0, 10, TimeUnit.MINUTES);
    }
}