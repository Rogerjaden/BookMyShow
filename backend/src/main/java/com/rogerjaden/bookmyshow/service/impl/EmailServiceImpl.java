package com.rogerjaden.bookmyshow.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class EmailServiceImpl {

    private static final String BREVO_API_URL =
            "https://api.brevo.com/v3/smtp/email";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String fromEmail;
    private final String fromName;

    public EmailServiceImpl(
            ObjectMapper objectMapper,
            @Value("${brevo.api-key}") String apiKey,
            @Value("${brevo.from-email}") String fromEmail,
            @Value("${brevo.from-name:BMS-Clone}") String fromName) {

        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public String sendEmail(String to, String subject, String body) {
        try {
            Map<String, Object> payload = Map.of(
                    "sender", Map.of(
                            "name", fromName,
                            "email", fromEmail
                    ),
                    "to", List.of(Map.of("email", to)),
                    "subject", subject,
                    "textContent", body
            );

            String requestBody =
                    objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .timeout(Duration.ofSeconds(30))
                    .header("accept", "application/json")
                    .header("api-key", apiKey)
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() >= 200
                    && response.statusCode() < 300) {
                return "SENT";
            }

            throw new IllegalStateException(
                    "Brevo email delivery failed. HTTP status: "
                            + response.statusCode()
                            + ". Response: "
                            + response.body()
            );

        } catch (IOException ex) {
            throw new IllegalStateException(
                    "Failed to communicate with Brevo API", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                    "Brevo email request was interrupted", ex);
        }
    }
}
