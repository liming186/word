package com.example.wordapp.dto;

import jakarta.validation.constraints.NotNull;

public record ReviewRequest(@NotNull Boolean correct) {}
