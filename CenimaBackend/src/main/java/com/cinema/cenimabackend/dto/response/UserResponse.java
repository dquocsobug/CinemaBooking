package com.cinema.cenimabackend.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.util.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private LocalDate dateOfBirth;
    private Set<String> roles;
    private Boolean isVerified;
}