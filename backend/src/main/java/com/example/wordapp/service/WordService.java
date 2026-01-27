package com.example.wordapp.service;

import com.example.wordapp.dto.ImportResult;
import com.example.wordapp.dto.ReviewRequest;
import com.example.wordapp.dto.WordPayload;
import com.example.wordapp.entity.ReviewRecord;
import com.example.wordapp.entity.User;
import com.example.wordapp.entity.Word;
import com.example.wordapp.repository.ReviewRecordRepository;
import com.example.wordapp.repository.UserRepository;
import com.example.wordapp.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import com.example.wordapp.util.TimeUtil;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class WordService {
    private final WordRepository wordRepository;
    private final UserRepository userRepository;
    private final ReviewRecordRepository reviewRecordRepository;

    @Cacheable(cacheNames = "wordListV2", key = "#username", condition = "#query == null || #query.isBlank()")
    public List<Word> listWords(String username, String query) {
        if (query != null && !query.isBlank()) {
            return wordRepository.findByOwnerUsernameAndTermContainingIgnoreCaseOrderByUpdatedAtDesc(username, query.trim());
        }
        return wordRepository.findByOwnerUsernameOrderByUpdatedAtDesc(username);
    }

    @CacheEvict(cacheNames = {"wordListV2", "dueWordsV2", "incorrectWordsV2", "studyOverviewV1"}, key = "#username")
    public Word createWord(String username, WordPayload payload) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));
        Word word = Word.builder()
                .term(payload.term())
                .definition(payload.definition())
                .example(payload.example())
                .meanings(payload.meanings())
                .examples(payload.examples())
                .wordRoot(payload.wordRoot())
                .similarWords(payload.similarWords())
                .examTag(payload.examTag())
                .owner(user)
                .build();
        return wordRepository.save(word);
    }

    @CacheEvict(cacheNames = {"wordListV2", "dueWordsV2", "incorrectWordsV2", "studyOverviewV1"}, key = "#username")
    public Word updateWord(String username, Long id, WordPayload payload) {
        Word word = findOwnedWord(username, id);
        word.setTerm(payload.term());
        word.setDefinition(payload.definition());
        word.setExample(payload.example());
        word.setMeanings(payload.meanings());
        word.setExamples(payload.examples());
        word.setWordRoot(payload.wordRoot());
        word.setSimilarWords(payload.similarWords());
        word.setExamTag(payload.examTag());
        return wordRepository.save(word);
    }

    @CacheEvict(cacheNames = {"wordListV2", "dueWordsV2", "incorrectWordsV2", "studyOverviewV1"}, key = "#username")
    public void deleteWord(String username, Long id) {
        Word word = findOwnedWord(username, id);
        wordRepository.delete(word);
    }

    @CacheEvict(cacheNames = {"wordListV2", "dueWordsV2", "incorrectWordsV2", "studyStatsV2", "studyOverviewV1"}, key = "#username")
    public Word review(String username, Long id, ReviewRequest request) {
        Word word = findOwnedWord(username, id);
        boolean correct = Boolean.TRUE.equals(request.correct());
        int familiarity = word.getFamiliarity() == null ? 0 : word.getFamiliarity();
        familiarity = Math.max(0, Math.min(5, correct ? familiarity + 1 : familiarity - 1));
        word.setFamiliarity(familiarity);
        word.setNextReviewAt(calculateNextReview(familiarity));
        wordRepository.save(word);

        ReviewRecord record = ReviewRecord.builder()
                .word(word)
                .user(word.getOwner())
                .correct(correct)
                .build();
        reviewRecordRepository.save(record);
        return word;
    }

    @Cacheable(cacheNames = "dueWordsV2", key = "#username")
    public List<Word> dueWords(String username) {
        return wordRepository.findDueWords(username, TimeUtil.nowDateTime());
    }

    @Cacheable(cacheNames = "incorrectWordsV2", key = "#username")
    public List<Word> incorrectWords(String username) {
        List<ReviewRecord> records = reviewRecordRepository.findIncorrectRecordsWithWord(username);
        Map<Long, Word> unique = new LinkedHashMap<>();
        for (ReviewRecord record : records) {
            Word word = record.getWord();
            if (word != null) {
                unique.putIfAbsent(word.getId(), word);
            }
        }
        return new ArrayList<>(unique.values());
    }

    @CacheEvict(cacheNames = {"wordListV2", "dueWordsV2", "incorrectWordsV2", "studyOverviewV1"}, key = "#username")
    public ImportResult importWords(String username, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请上传有效的单词本文件");
        }
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));
        String content = extractText(file);
        ParseResult parseResult = parseWords(content);
        if (!parseResult.words.isEmpty()) {
            List<Word> toSave = new ArrayList<>();
            for (ParsedWord parsed : parseResult.words) {
                Word word = Word.builder()
                        .term(parsed.term)
                        .definition(parsed.definition)
                        .example(parsed.example)
                        .meanings(parsed.meanings)
                        .examples(parsed.examples)
                        .wordRoot(parsed.wordRoot)
                        .similarWords(parsed.similarWords)
                        .examTag(parsed.examTag)
                        .owner(user)
                        .build();
                toSave.add(word);
            }
            wordRepository.saveAll(toSave);
        }
        return new ImportResult(parseResult.words.size(), parseResult.skippedCount);
    }

    private Word findOwnedWord(String username, Long id) {
        return wordRepository.findByIdAndOwnerUsername(id, username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "未找到该单词"));
    }

    private LocalDateTime calculateNextReview(int familiarity) {
        LocalDateTime now = TimeUtil.nowDateTime();
        return switch (familiarity) {
            case 0 -> now.plus(1, ChronoUnit.HOURS);
            case 1 -> now.plus(1, ChronoUnit.DAYS);
            case 2 -> now.plus(3, ChronoUnit.DAYS);
            case 3 -> now.plus(7, ChronoUnit.DAYS);
            case 4 -> now.plus(14, ChronoUnit.DAYS);
            default -> now.plus(30, ChronoUnit.DAYS);
        };
    }

    private String extractText(MultipartFile file) {
        String filename = file.getOriginalFilename();
        String lower = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        try {
            if (lower.endsWith(".txt")) {
                return new String(file.getBytes(), StandardCharsets.UTF_8);
            }
            if (lower.endsWith(".docx")) {
                try (XWPFDocument document = new XWPFDocument(file.getInputStream());
                     XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
                    return extractor.getText();
                }
            }
            if (lower.endsWith(".doc")) {
                try (HWPFDocument document = new HWPFDocument(file.getInputStream());
                     WordExtractor extractor = new WordExtractor(document)) {
                    return extractor.getText();
                }
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "解析单词本失败");
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "仅支持 txt/doc/docx 格式");
    }

    private ParseResult parseWords(String content) {
        List<ParsedWord> words = new ArrayList<>();
        int skipped = 0;
        String[] lines = content.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            ParsedWord parsed = parseLine(trimmed);
            if (parsed == null || parsed.term.isBlank()) {
                skipped++;
                continue;
            }
            words.add(parsed);
        }
        return new ParseResult(words, skipped);
    }

    private ParsedWord parseLine(String line) {
        String[] parts = splitByDelimiters(line, 7, "\t", "｜", "|");
        if (parts.length == 1) {
            parts = line.split("\\s*[-–—:：]\\s*", 7);
        }
        // 兼容带序号的单词本（如：4518<TAB>song<TAB>...）
        if (parts.length >= 2 && parts[0].trim().matches("\\d+")) {
            parts = Arrays.copyOfRange(parts, 1, parts.length);
        }
        String term = parts.length > 0 ? parts[0].trim() : "";
        String definition = parts.length > 1 ? parts[1].trim() : "";
        String example = "";
        String meanings = "";
        String examples = "";
        String wordRoot = "";
        String similarWords = "";
        String examTag = "";
        if (parts.length <= 3) {
            example = parts.length > 2 ? parts[2].trim() : "";
        } else {
            meanings = parts.length > 2 ? parts[2].trim() : "";
            examples = parts.length > 3 ? parts[3].trim() : "";
            wordRoot = parts.length > 4 ? parts[4].trim() : "";
            similarWords = parts.length > 5 ? parts[5].trim() : "";
            examTag = parts.length > 6 ? parts[6].trim() : "";
            if (!examples.isBlank()) {
                String[] exampleParts = examples.split("\\r?\\n|；|;|、");
                if (exampleParts.length > 0) {
                    example = exampleParts[0].trim();
                }
            }
        }
        if (term.isEmpty()) {
            return null;
        }
        return new ParsedWord(term, definition, example, meanings, examples, wordRoot, similarWords, examTag);
    }

    private String[] splitByDelimiters(String line, int limit, String... delimiters) {
        for (String delimiter : delimiters) {
            if (line.contains(delimiter)) {
                return line.split("\\s*" + java.util.regex.Pattern.quote(delimiter) + "\\s*", limit);
            }
        }
        return new String[]{line};
    }

    private record ParsedWord(
            String term,
            String definition,
            String example,
            String meanings,
            String examples,
            String wordRoot,
            String similarWords,
            String examTag
    ) {
    }

    private record ParseResult(List<ParsedWord> words, int skippedCount) {
    }
}
