package com.example.wordapp.controller;

import com.example.wordapp.dto.VocabAnalysisRequest;
import com.example.wordapp.dto.VocabAnalysisResponse;
import com.example.wordapp.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {
    private final AiService aiService;

    @PostMapping("/vocab-analysis")
    public ResponseEntity<VocabAnalysisResponse> analyze(@RequestBody VocabAnalysisRequest request) {
        String analysis = aiService.analyzeVocab(request);
        return ResponseEntity.ok(new VocabAnalysisResponse(analysis));
    }
}
