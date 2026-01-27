package com.example.wordapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "用户名不能为空") @Size(min = 3, max = 32) String username,
        @Email(message = "邮箱格式不正确") String email,
        @NotBlank(message = "密码不能为空") @Size(min = 6, max = 64) String password
) {}
