package com.example.wordapp.repository;

import com.example.wordapp.entity.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WordRepository extends JpaRepository<Word, Long> {
    List<Word> findByOwnerUsernameOrderByUpdatedAtDesc(String username);

    List<Word> findByOwnerUsernameAndTermContainingIgnoreCaseOrderByUpdatedAtDesc(String username, String term);

    Optional<Word> findByIdAndOwnerUsername(Long id, String username);

    @Query("select w from Word w where w.owner.username = :username and (w.nextReviewAt is null or w.nextReviewAt <= :now) order by w.nextReviewAt")
    List<Word> findDueWords(@Param("username") String username, @Param("now") LocalDateTime now);

    long countByOwnerUsername(String username);

    @Query("select count(w) from Word w where w.owner.username = :username and (w.nextReviewAt is null or w.nextReviewAt <= :now)")
    long countDueWords(@Param("username") String username, @Param("now") LocalDateTime now);
}
