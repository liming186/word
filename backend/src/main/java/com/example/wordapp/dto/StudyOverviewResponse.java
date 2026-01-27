package com.example.wordapp.dto;

public record StudyOverviewResponse(StudyStatsResponse stats, long wordCount, long dueCount) {
}
