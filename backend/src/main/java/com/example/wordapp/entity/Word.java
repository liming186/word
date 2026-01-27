package com.example.wordapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import com.example.wordapp.util.TimeUtil;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "words")
public class Word {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String term;

    @Column(nullable = false, length = 512)
    private String definition;

    @Column(length = 512)
    private String example;

    @Column(length = 1024)
    private String meanings;

    @Column(length = 1024)
    private String examples;

    @Column(length = 256)
    private String wordRoot;

    @Column(length = 512)
    private String similarWords;

    @Column(length = 128)
    private String examTag;

    private Integer familiarity; // 0-5 简单熟悉度

    private LocalDateTime nextReviewAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User owner;

    @PrePersist
    public void prePersist() {
        createdAt = TimeUtil.nowDateTime();
        updatedAt = createdAt;
        if (familiarity == null) {
            familiarity = 0;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = TimeUtil.nowDateTime();
    }
}
