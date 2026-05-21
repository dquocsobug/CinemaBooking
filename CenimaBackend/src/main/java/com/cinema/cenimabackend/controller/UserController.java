package com.cinema.cenimabackend.controller;

import com.cinema.cenimabackend.dto.response.*;
import com.cinema.cenimabackend.entity.User;
import com.cinema.cenimabackend.exception.ResourceNotFoundException;
import com.cinema.cenimabackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(
            @AuthenticationPrincipal UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
        return ResponseEntity.ok(ApiResponse.ok(toResponse(user)));
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .avatarUrl(u.getAvatarUrl())
                .dateOfBirth(u.getDateOfBirth())
                .isVerified(u.getIsVerified())
                .roles(u.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet()))
                .build();
    }
}
