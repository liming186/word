package com.example.wordapp.repository;

import com.example.wordapp.entity.StudyRecord;
import com.example.wordapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface StudyRecordRepository extends JpaRepository<StudyRecord, Long> {
    boolean existsByUserAndStudyDate(User user, LocalDate studyDate);
    List<StudyRecord> findByUserOrderByStudyDateDesc(User user);
}
