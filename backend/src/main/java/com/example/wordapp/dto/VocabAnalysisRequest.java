package com.example.wordapp.dto;

import java.util.List;

public record VocabAnalysisRequest(
        int score,
        int total,
        int timeUsedSeconds,
        String levelEstimate,
        List<VocabAnswerItem> answers
) {
}
