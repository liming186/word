package com.example.wordapp.dto;

import com.example.wordapp.entity.Word;

import java.util.List;

public record TodayStudyResponse(List<Word> words, long todayCount) {
}
