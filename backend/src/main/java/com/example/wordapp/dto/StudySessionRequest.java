package com.example.wordapp.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record StudySessionRequest(
        @NotNull Instant startedAt,
        @Min(value = 10, message = "学习时长过短")
        int durationSeconds
) {
}
