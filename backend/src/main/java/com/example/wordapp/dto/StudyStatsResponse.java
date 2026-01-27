package com.example.wordapp.dto;

import java.time.LocalDate;

public record StudyStatsResponse(long totalDays, long streakDays, LocalDate lastStudyDate, long todayCount) {
}
