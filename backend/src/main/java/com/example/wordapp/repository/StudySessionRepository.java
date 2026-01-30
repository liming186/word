package com.example.wordapp.repository;

import com.example.wordapp.entity.StudySession;
import com.example.wordapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    List<StudySession> findByUserAndStartedAtAfterOrderByStartedAtDesc(User user, LocalDateTime after);
}
