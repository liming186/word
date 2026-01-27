package com.example.wordapp.service;

import com.example.wordapp.dto.VocabAnalysisRequest;
import com.example.wordapp.dto.VocabAnswerItem;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiService {
    @Value("${app.ai.api-key:}")
    private String apiKey;

    @Value("${app.ai.api-base:https://api.openai.com}")
    private String apiBase;

    @Value("${app.ai.model:gpt-5.2}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    public String analyzeVocab(VocabAnalysisRequest request) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("AI API key not configured");
        }

        String resolvedApiBase = (apiBase == null || apiBase.isBlank()) ? "https://api.openai.com" : apiBase;
        String url = resolvedApiBase.endsWith("/") ? resolvedApiBase.substring(0, resolvedApiBase.length() - 1) : resolvedApiBase;
        url = url + "/v1/chat/completions";

        String summary = buildSummary(request);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of(
                "role", "system",
                "content",
                "你是英语词汇量诊断助手。基于用户的测验结果给出简明、具体、可执行的反馈，包含：大致词汇水平、薄弱点、2-3条提升建议。不能出现*这种符号"
        ));
        messages.add(Map.of(
                "role", "user",
                "content", summary
        ));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("messages", messages);
        payload.put("temperature", 0.3);

        String safeApiKey = Objects.requireNonNull(apiKey, "AI API key not configured");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(safeApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response =
                (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.postForEntity(url, entity, Map.class);
        Map<String, Object> body = response.getBody();
        if (body == null || !body.containsKey("choices")) {
            throw new IllegalStateException("AI response is empty");
        }

        List<?> choices = (List<?>) body.get("choices");
        if (choices.isEmpty()) {
            throw new IllegalStateException("AI response has no choices");
        }

        Map<?, ?> first = (Map<?, ?>) choices.get(0);
        Map<?, ?> message = (Map<?, ?>) first.get("message");
        Object content = message != null ? message.get("content") : null;
        if (content == null) {
            throw new IllegalStateException("AI response has no content");
        }
        return content.toString().trim();
    }

    private String buildSummary(VocabAnalysisRequest request) {
        String mistakes = "";
        if (request.answers() != null && !request.answers().isEmpty()) {
            mistakes = request.answers().stream()
                    .filter(a -> !a.correct())
                    .map(this::formatMistake)
                    .collect(Collectors.joining("\n"));
        }

        return "测验概况:\n"
                + "总题数: " + request.total() + "\n"
                + "得分: " + request.score() + "\n"
                + "用时: " + request.timeUsedSeconds() + "秒\n"
                + "预估水平: " + request.levelEstimate() + "\n"
                + "错题详情:\n"
                + (mistakes.isBlank() ? "无" : mistakes);
    }

    private String formatMistake(VocabAnswerItem item) {
        return "- [" + item.level() + "] " + item.prompt()
                + " | 选择: " + item.selectedOption()
                + " | 正确: " + item.correctOption();
    }
}
