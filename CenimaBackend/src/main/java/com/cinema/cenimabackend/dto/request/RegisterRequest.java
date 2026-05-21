package com.cinema.cenimabackend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class RegisterRequest {
    @Email @NotBlank
    private String email;

    @NotBlank @Size(min = 6, max = 100)
    private String password;

    @NotBlank @Size(min = 2, max = 150)
    private String fullName;

    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    private LocalDate dateOfBirth;
}