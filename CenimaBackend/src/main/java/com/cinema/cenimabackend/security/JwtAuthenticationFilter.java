package com.cinema.cenimabackend.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String token = extractToken(req);

        if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
            try {
                UUID userId = tokenProvider.getUserIdFromToken(token);
                String email = tokenProvider.getEmailFromToken(token);

                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                var auth = new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        userDetails.getAuthorities()
                );

                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (Exception ex) {
                log.error("Cannot set user authentication: {}", ex.getMessage());
            }
        }

        chain.doFilter(req, res);
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");

        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }

        return null;
    }
}