package com.example.wordapp.controller;

import com.example.wordapp.dto.ImportResult;
import com.example.wordapp.dto.ReviewRequest;
import com.example.wordapp.dto.WordPayload;
import com.example.wordapp.entity.Word;
import com.example.wordapp.service.WordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/words")
@RequiredArgsConstructor
public class WordController {
    private final WordService wordService;

    @GetMapping
    public ResponseEntity<List<Word>> list(@AuthenticationPrincipal UserDetails user, @RequestParam(required = false) String q) {
        return ResponseEntity.ok(wordService.listWords(user.getUsername(), q));
    }

    @PostMapping
    public ResponseEntity<Word> create(@AuthenticationPrincipal UserDetails user, @Valid @RequestBody WordPayload payload) {
        return ResponseEntity.ok(wordService.createWord(user.getUsername(), payload));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Word> update(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @Valid @RequestBody WordPayload payload) {
        return ResponseEntity.ok(wordService.updateWord(user.getUsername(), id, payload));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        wordService.deleteWord(user.getUsername(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<Word> review(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(wordService.review(user.getUsername(), id, request));
    }

    @GetMapping("/due")
    public ResponseEntity<List<Word>> due(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(wordService.dueWords(user.getUsername()));
    }

    @GetMapping("/incorrect")
    public ResponseEntity<List<Word>> incorrect(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(wordService.incorrectWords(user.getUsername()));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportResult> importWords(@AuthenticationPrincipal UserDetails user,
                                                    @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(wordService.importWords(user.getUsername(), file));
    }
}
