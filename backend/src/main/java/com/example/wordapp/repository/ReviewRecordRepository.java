package com.example.wordapp.repository;

import com.example.wordapp.entity.ReviewRecord;
import com.example.wordapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReviewRecordRepository extends JpaRepository<ReviewRecord, Long> {
    long countByUserAndReviewedAtBetween(User user, LocalDateTime start, LocalDateTime end);

    @Query("select rr from ReviewRecord rr join fetch rr.word where rr.user.username = :username and rr.correct = false order by rr.reviewedAt desc")
    List<ReviewRecord> findIncorrectRecordsWithWord(@Param("username") String username);
}
