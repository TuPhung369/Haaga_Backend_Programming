package com.database.study.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.database.study.entity.User;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    /**
     * Ensure a user is registered as a subscriber in Novu
     */
    public void registerUserAsSubscriber(User user) {
        log.info("Notification service temporarily disabled");
    }

    /**
     * Send a new message notification
     */
    public void sendNewMessageNotification(UUID senderId, UUID receiverId, String messageContent) {
        log.info("Notification service temporarily disabled");
    }

    /**
     * Send a contact request notification
     */
    public void sendContactRequestNotification(UUID requesterId, UUID receiverId) {
        log.info("Notification service temporarily disabled");
    }

    /**
     * Send a contact accepted notification
     */
    public void sendContactAcceptedNotification(UUID accepterId, UUID requesterId) {
        log.info("Notification service temporarily disabled");
    }

    /**
     * Create a topic for group messaging
     */
    public String createTopic(String topicName) {
        log.info("Notification service temporarily disabled");
        return "dummy-topic-key";
    }

    /**
     * Add a subscriber to a topic
     */
    public void addSubscriberToTopic(String topicKey, UUID subscriberId) {
        log.info("Notification service temporarily disabled");
    }

    /**
     * Remove a subscriber from a topic
     */
    public void removeSubscriberFromTopic(String topicKey, UUID subscriberId) {
        log.info("Notification service temporarily disabled");
    }

}
