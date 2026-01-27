package com.example.wordapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@SpringBootApplication
public class WordAppApplication {
    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(WordAppApplication.class, args);
    }

    private static void loadDotEnv() {
        Set<String> allowedKeys = new HashSet<>(Set.of(
                "GPT_API_KEY",
                "GPT_API_BASE",
                "GPT_MODEL",
                "OPENAI_API_KEY"
        ));
        Path cwd = Path.of("").toAbsolutePath();
        List<Path> candidates = List.of(
                cwd.resolve(".env"),
                cwd.resolve("../.env"),
                cwd.resolve("../frontend/.env")
        );

        for (Path path : candidates) {
            if (!Files.exists(path)) {
                continue;
            }
            try {
                List<String> lines = Files.readAllLines(path.normalize(), StandardCharsets.UTF_8);
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) {
                        continue;
                    }
                    int idx = trimmed.indexOf('=');
                    String key = trimmed.substring(0, idx).trim();
                    String value = trimmed.substring(idx + 1).trim();
                    if (!allowedKeys.contains(key)) {
                        continue;
                    }
                    if (System.getenv(key) != null || System.getProperty(key) != null) {
                        continue;
                    }
                    System.setProperty(key, stripQuotes(value));
                }
            } catch (IOException ignored) {
                // Skip unreadable .env files; environment variables still take precedence.
            }
        }
    }

    private static String stripQuotes(String value) {
        if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }
}
