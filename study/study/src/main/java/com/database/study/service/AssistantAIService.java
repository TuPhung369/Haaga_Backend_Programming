package com.database.study.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.database.study.dto.request.AssistantAIMessageRequest;
import com.database.study.dto.response.AssistantAIMessageResponse;
import com.database.study.entity.AssistantAIMessage;
import com.database.study.entity.AssistantAIMessage.MessageSender;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.AssistantAIMessageRepository;
import com.database.study.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssistantAIService {

    private final AssistantAIMessageRepository assistantAIMessageRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${n8n.webhook.url}")
    private String n8nWebhookUrl;

    @Transactional(readOnly = true)
    public List<AssistantAIMessageResponse> getChatHistory(String userId, int page, int size) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        log.info("Getting chat history for user {} with page {} and size {}", userId, page, size);

        if (page >= 0 && size > 0) {
            // Use pagination if page and size are specified
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
            Page<AssistantAIMessage> messages = assistantAIMessageRepository.findByUserOrderByTimestampDesc(user,
                    pageable);

            // Reverse the list to get chronological order for the client (oldest first)
            List<AssistantAIMessage> chronologicalMessages = messages.getContent();
            return chronologicalMessages.stream()
                    .sorted((m1, m2) -> m1.getTimestamp().compareTo(m2.getTimestamp()))
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        } else {
            // Fall back to get all messages if pagination parameters are invalid
            return assistantAIMessageRepository.findByUserOrderByTimestampAsc(user)
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
    }

    @Transactional
    public AssistantAIMessageResponse sendMessage(AssistantAIMessageRequest request) {
        User user = userRepository.findById(UUID.fromString(request.getUserId()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        log.info("Sending message for user {} with session {}", request.getUserId(), request.getSessionId());

        // Save user message
        AssistantAIMessage userMessage = AssistantAIMessage.builder()
                .user(user)
                .content(request.getMessage())
                .sender(MessageSender.USER)
                .timestamp(LocalDateTime.now())
                .sessionId(request.getSessionId())
                .build();
        assistantAIMessageRepository.save(userMessage);

        // Send message to n8n webhook and get response
        String aiResponse = callN8nWebhook(request);

        // Save AI response
        AssistantAIMessage aiMessage = AssistantAIMessage.builder()
                .user(user)
                .content(aiResponse)
                .sender(MessageSender.AI)
                .timestamp(LocalDateTime.now())
                .sessionId(request.getSessionId())
                .build();
        assistantAIMessageRepository.save(aiMessage);

        return mapToResponse(aiMessage);
    }

    private String callN8nWebhook(AssistantAIMessageRequest request) {
        try {
            // Create request body
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("message", request.getMessage());
            requestBody.put("sessionId", request.getSessionId());
            requestBody.put("userId", request.getUserId());
            requestBody.put("output", request.getMessage()); // Add output field for compatibility

            // Set up headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Create the request entity
            HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);

            log.info("Calling n8n webhook for message processing with payload: {}", requestBody);

            // Call n8n webhook
            String response = restTemplate.postForObject(n8nWebhookUrl, entity, String.class);
            log.info("Received response from n8n: {}", response);

            // Extract response text
            JsonNode responseNode = objectMapper.readTree(response);
            if (responseNode.has("output")) {
                return responseNode.get("output").asText();
            } else if (responseNode.has("text")) {
                return responseNode.get("text").asText();
            } else if (responseNode.has("response")) {
                return responseNode.get("response").asText();
            } else {
                log.warn("No recognized response field found in n8n response: {}", response);
                return "I couldn't process your request. Please try again.";
            }
        } catch (org.springframework.web.client.RestClientException e) {
            log.error("Error connecting to n8n webhook: ", e);
            return "Sorry, I encountered an error while connecting to the AI service. Please try again later.";
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            log.error("Error processing JSON response from n8n: ", e);
            return "Sorry, I encountered an error while processing the AI response. Please try again.";
        } catch (Exception e) {
            log.error("Unexpected error calling n8n webhook: ", e);
            return "Sorry, I encountered an unexpected error. Please try again later.";
        }
    }

    private AssistantAIMessageResponse mapToResponse(AssistantAIMessage message) {
        return AssistantAIMessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .sender(message.getSender().name())
                .timestamp(message.getTimestamp())
                .sessionId(message.getSessionId())
                .build();
    }
}