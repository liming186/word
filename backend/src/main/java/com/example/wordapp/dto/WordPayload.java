package com.example.wordapp.dto;

import jakarta.validation.constraints.NotBlank;

public record WordPayload(
        @NotBlank(message = "单词不能为空") String term,
        @NotBlank(message = "释义不能为空") String definition,
        String example,
        String meanings,
        String examples,
        String wordRoot,
        String similarWords,
        String examTag
) {}
