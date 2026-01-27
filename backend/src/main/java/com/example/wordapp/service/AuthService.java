package com.example.wordapp.service;

import com.example.wordapp.dto.AuthRequest;
import com.example.wordapp.dto.AuthResponse;
import com.example.wordapp.dto.RegisterRequest;
import com.example.wordapp.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;

    public AuthResponse register(RegisterRequest request) {
        User user = userService.register(request);
        return new AuthResponse(jwtService.generateToken(user), user.getUsername());
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        User user = userService.findByUsername(request.username());
        return new AuthResponse(jwtService.generateToken(user), user.getUsername());
    }
}
