package com.database.study.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.database.study.dto.request.ChatMessageRequest;
import com.database.study.dto.response.ChatMessageResponse;
import com.database.study.entity.ChatMessage;
import com.database.study.entity.ChatMessage.MessageSender;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.ChatMessageRepository;
import com.database.study.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${n8n.webhook.url}")
    private String n8nWebhookUrl;

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getChatHistory(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return chatMessageRepository.findByUserOrderByTimestampAsc(user)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponse sendMessage(ChatMessageRequest request) {
        User user = userRepository.findById(UUID.fromString(request.getUserId()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Save user message
        ChatMessage userMessage = ChatMessage.builder()
                .user(user)
                .content(request.getMessage())
                .sender(MessageSender.USER)
                .timestamp(LocalDateTime.now())
                .sessionId(request.getSessionId())
                .build();
        chatMessageRepository.save(userMessage);

        // Send message to n8n webhook and get response
        String aiResponse = callN8nWebhook(request);

        // Save AI response
        ChatMessage aiMessage = ChatMessage.builder()
                .user(user)
                .content(aiResponse)
                .sender(MessageSender.AI)
                .timestamp(LocalDateTime.now())
                .sessionId(request.getSessionId())
                .build();
        chatMessageRepository.save(aiMessage);

        return mapToResponse(aiMessage);
    }

    private String callN8nWebhook(ChatMessageRequest request) {
        try {
            // Create request body
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("chatInput", request.getMessage());
            requestBody.put("sessionId", request.getSessionId());

            // Set up headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Create the request entity
            HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);

            // Call n8n webhook
            String response = restTemplate.postForObject(n8nWebhookUrl, entity, String.class);

            // Extract response text
            JsonNode responseNode = objectMapper.readTree(response);
            if (responseNode.has("output")) {
                return responseNode.get("output").asText();
            } else if (responseNode.has("text")) {
                return responseNode.get("text").asText();
            } else if (responseNode.has("response")) {
                return responseNode.get("response").asText();
            } else {
                return "I couldn't process your request. Please try again.";
            }
        } catch (Exception e) {
            log.error("Error calling n8n webhook: ", e);
            return "Sorry, I encountered an error while processing your request.";
        }
    }

    private ChatMessageResponse mapToResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .sender(message.getSender().name())
                .timestamp(message.getTimestamp())
                .sessionId(message.getSessionId())
                .build();
    }
}