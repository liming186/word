package com.example.wordapp.dto;

public record StudyBehaviorResponse(
        int avgDurationMinutes,
        int preferredHour,
        int focusScore,
        int consistencyScore,
        int sessionsLast7Days,
        int todayMinutes
) {
}
