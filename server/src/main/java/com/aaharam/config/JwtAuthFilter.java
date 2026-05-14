package com.aaharam.config;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URL;
import java.security.interfaces.ECPublicKey;
import java.security.interfaces.RSAPublicKey;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final SupabaseProperties supabaseProperties;
    private final JwkProvider jwkProvider;

    public JwtAuthFilter(SupabaseProperties supabaseProperties) {
        this.supabaseProperties = supabaseProperties;
        String jwksUrl = supabaseProperties.getUrl().stripTrailing() + "/auth/v1/.well-known/jwks.json";
        try {
            this.jwkProvider = new JwkProviderBuilder(new URL(jwksUrl))
                    .cached(5, 1, TimeUnit.HOURS)
                    .rateLimited(10, 1, TimeUnit.MINUTES)
                    .build();
        } catch (Exception e) {
            throw new IllegalStateException("Could not build JWK provider from " + jwksUrl, e);
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        try {
            DecodedJWT decoded = verifyToken(token);
            String userId = decoded.getSubject();
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, List.of());
            SecurityContextHolder.getContext().setAuthentication(authentication);
            chain.doFilter(request, response);
        } catch (Exception e) {
            log.warn("JWT verification failed: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            MAPPER.writeValue(response.getWriter(),
                    Map.of("error", "Invalid or expired token", "detail", e.getMessage()));
        }
    }

    private DecodedJWT verifyToken(String token) throws Exception {
        DecodedJWT unverified = JWT.decode(token);
        String alg = unverified.getAlgorithm();

        if ("HS256".equals(alg)) {
            Algorithm algorithm = Algorithm.HMAC256(supabaseProperties.getJwtSecret().trim());
            JWTVerifier verifier = JWT.require(algorithm).build();
            return verifier.verify(token);
        }

        // ES256 or RS256 — verify via JWKS
        String kid = unverified.getKeyId();
        Jwk jwk = (kid != null) ? jwkProvider.get(kid) : jwkProvider.get(null);
        Algorithm algorithm;
        if ("EC".equals(jwk.getPublicKey().getAlgorithm())) {
            algorithm = Algorithm.ECDSA256((ECPublicKey) jwk.getPublicKey(), null);
        } else {
            algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);
        }
        return JWT.require(algorithm).build().verify(token);
    }
}
