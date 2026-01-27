package com.example.wordapp.dto;

public record VocabAnswerItem(
        String level,
        String prompt,
        String correctOption,
        String selectedOption,
        boolean correct
) {
}
