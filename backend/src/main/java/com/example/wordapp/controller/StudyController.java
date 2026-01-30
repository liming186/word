package com.example.wordapp.controller;

import com.example.wordapp.dto.StudyBehaviorResponse;
import com.example.wordapp.dto.StudyOverviewResponse;
import com.example.wordapp.dto.StudyStatsResponse;
import com.example.wordapp.dto.StudySessionRequest;
import com.example.wordapp.dto.TodayStudyResponse;
import com.example.wordapp.service.StudyService;
import com.example.wordapp.util.TimeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/study")
@RequiredArgsConstructor
public class StudyController {
    private final StudyService studyService;

    @GetMapping("/stats")
    public ResponseEntity<StudyStatsResponse> stats(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(studyService.getStats(user.getUsername()));
    }

    @GetMapping("/overview")
    public ResponseEntity<StudyOverviewResponse> overview(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(studyService.getOverview(user.getUsername()));
    }

    @GetMapping("/behavior")
    public ResponseEntity<StudyBehaviorResponse> behavior(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(studyService.getBehavior(user.getUsername()));
    }

    @GetMapping("/today")
    public ResponseEntity<TodayStudyResponse> today(@AuthenticationPrincipal UserDetails user,
                                                    @RequestParam int dailyTarget,
                                                    @RequestParam int newWordRatio,
                                                    @RequestParam(required = false) String importAfter) {
        LocalDateTime importAfterTime = null;
        if (importAfter != null && !importAfter.isBlank()) {
            try {
                importAfterTime = Instant.parse(importAfter).atZone(TimeUtil.CHINA_ZONE).toLocalDateTime();
            } catch (Exception ex) {
                throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "importAfter 格式不正确");
            }
        }
        return ResponseEntity.ok(studyService.getTodayStudy(user.getUsername(), dailyTarget, newWordRatio, importAfterTime));
    }

    @PostMapping("/record")
    public ResponseEntity<StudyStatsResponse> record(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(studyService.recordStudy(user.getUsername()));
    }

    @PostMapping("/session")
    public ResponseEntity<Void> session(@AuthenticationPrincipal UserDetails user,
                                        @RequestBody StudySessionRequest request) {
        studyService.recordSession(user.getUsername(), request);
        return ResponseEntity.ok().build();
    }
}
