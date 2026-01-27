package com.example.wordapp.service;

import com.example.wordapp.dto.StudyOverviewResponse;
import com.example.wordapp.dto.StudyStatsResponse;
import com.example.wordapp.dto.TodayStudyResponse;
import com.example.wordapp.entity.StudyRecord;
import com.example.wordapp.entity.User;
import com.example.wordapp.repository.ReviewRecordRepository;
import com.example.wordapp.repository.StudyRecordRepository;
import com.example.wordapp.repository.UserRepository;
import com.example.wordapp.repository.WordRepository;
import com.example.wordapp.util.TimeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.LinkedHashSet;

@Service
@RequiredArgsConstructor
public class StudyService {
    private final UserRepository userRepository;
    private final StudyRecordRepository studyRecordRepository;
    private final ReviewRecordRepository reviewRecordRepository;
    private final WordRepository wordRepository;

    @Cacheable(cacheNames = "studyStatsV2", key = "#username")
    public StudyStatsResponse getStats(String username) {
        User user = findUser(username);
        List<StudyRecord> records = studyRecordRepository.findByUserOrderByStudyDateDesc(user);
        long totalDays = records.size();
        long streakDays = calculateStreak(records);
        LocalDate lastStudyDate = records.isEmpty() ? null : records.get(0).getStudyDate();
        long todayCount = countTodayReviews(user);
        return new StudyStatsResponse(totalDays, streakDays, lastStudyDate, todayCount);
    }

    @Cacheable(cacheNames = "studyOverviewV1", key = "#username")
    public StudyOverviewResponse getOverview(String username) {
        StudyStatsResponse stats = getStats(username);
        long wordCount = wordRepository.countByOwnerUsername(username);
        long dueCount = wordRepository.countDueWords(username, TimeUtil.nowDateTime());
        return new StudyOverviewResponse(stats, wordCount, dueCount);
    }

    public TodayStudyResponse getTodayStudy(String username, int dailyTarget, int newWordRatio, LocalDateTime importAfter) {
        User user = findUser(username);
        long todayCount = countTodayReviews(user);
        int remaining = Math.max(0, dailyTarget - (int) todayCount);
        if (remaining == 0) {
            return new TodayStudyResponse(List.of(), todayCount);
        }

        LocalDateTime now = TimeUtil.nowDateTime();
        List<com.example.wordapp.entity.Word> due = wordRepository.findDueWords(username, now);
        List<com.example.wordapp.entity.Word> allWords = wordRepository.findByOwnerUsernameOrderByUpdatedAtDesc(username);
        List<com.example.wordapp.entity.Word> newWords = allWords.stream()
                .filter(word -> word.getFamiliarity() == null || word.getFamiliarity() <= 0)
                .toList();

        if (importAfter != null) {
            due = due.stream().filter(word -> word.getCreatedAt() != null && !word.getCreatedAt().isBefore(importAfter)).toList();
            newWords = newWords.stream().filter(word -> word.getCreatedAt() != null && !word.getCreatedAt().isBefore(importAfter)).toList();
            allWords = allWords.stream().filter(word -> word.getCreatedAt() != null && !word.getCreatedAt().isBefore(importAfter)).toList();
        }

        int targetNew = Math.round(remaining * (newWordRatio / 100f));
        int targetReview = remaining - targetNew;

        Set<com.example.wordapp.entity.Word> selected = new LinkedHashSet<>();
        for (int i = 0; i < due.size() && selected.size() < targetReview; i++) {
            selected.add(due.get(i));
        }
        for (int i = 0; i < newWords.size() && selected.size() < targetReview + targetNew; i++) {
            selected.add(newWords.get(i));
        }
        if (selected.size() < remaining) {
            for (int i = 0; i < allWords.size() && selected.size() < remaining; i++) {
                selected.add(allWords.get(i));
            }
        }

        return new TodayStudyResponse(new ArrayList<>(selected), todayCount);
    }

    @CacheEvict(cacheNames = {"studyStatsV2", "studyOverviewV1"}, key = "#username")
    public StudyStatsResponse recordStudy(String username) {
        User user = findUser(username);
        LocalDate today = TimeUtil.nowDate();
        if (!studyRecordRepository.existsByUserAndStudyDate(user, today)) {
            StudyRecord record = StudyRecord.builder()
                    .user(user)
                    .studyDate(today)
                    .build();
            try {
                studyRecordRepository.save(record);
            } catch (DataIntegrityViolationException ignored) {
                // ignore duplicate record race condition
            }
        }
        return getStats(username);
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));
    }

    private long calculateStreak(List<StudyRecord> records) {
        if (records.isEmpty()) {
            return 0;
        }
        long streak = 1;
        LocalDate prev = records.get(0).getStudyDate();
        for (int i = 1; i < records.size(); i++) {
            LocalDate current = records.get(i).getStudyDate();
            if (prev.minusDays(1).equals(current)) {
                streak++;
                prev = current;
            } else {
                break;
            }
        }
        return streak;
    }

    private long countTodayReviews(User user) {
        LocalDateTime start = TimeUtil.startOfToday();
        LocalDateTime end = TimeUtil.startOfTomorrow();
        return reviewRecordRepository.countByUserAndReviewedAtBetween(user, start, end);
    }
}
