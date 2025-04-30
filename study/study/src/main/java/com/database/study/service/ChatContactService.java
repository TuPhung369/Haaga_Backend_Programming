package com.database.study.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.database.study.dto.request.ChatContactRequest;
import com.database.study.dto.response.ChatContactResponse;
import com.database.study.entity.ChatContact;
import com.database.study.entity.ChatContact.ContactStatus;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.mapper.ChatContactMapper;
import com.database.study.repository.ChatContactRepository;
import com.database.study.repository.ChatMessageRepository;
import com.database.study.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing chat contacts and contact requests
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatContactService {

        private final ChatContactRepository contactRepository;
        private final UserRepository userRepository;
        private final ChatMessageRepository messageRepository;
        private final ChatContactMapper contactMapper;
        private final SimpMessagingTemplate messagingTemplate;

        @Transactional
        public ChatContactResponse addContact(String userId, ChatContactRequest request) {
                User user = userRepository.findById(UUID.fromString(userId))
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                // Find the contact user by username or email
                User contactUser = userRepository.findByUsername(request.getUsernameOrEmail())
                                .orElseGet(() -> userRepository.findByEmail(request.getUsernameOrEmail())
                                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND)));

                // Check if trying to add self
                if (user.getId().equals(contactUser.getId())) {
                        throw new AppException(ErrorCode.INVALID_REQUEST)
                                        .addMetadata("message", "Cannot add yourself as a contact");
                }

                // Check if already a contact
                if (contactRepository.existsByUserAndContact(user, contactUser)) {
                        throw new AppException(ErrorCode.CONTACT_ALREADY_EXISTS);
                }

                // Create the contact
                ChatContact contact = contactMapper.toEntity(user, contactUser, request.getDisplayName());
                contact = contactRepository.save(contact);

                log.info("Contact request sent from {} to {}", user.getUsername(), contactUser.getUsername());

                // Notify the contact user about the request
                ChatContactResponse response = contactMapper.toResponse(contact);
                messagingTemplate.convertAndSendToUser(
                                contactUser.getId().toString(),
                                "/queue/contact-requests",
                                response);

                return response;
        }

        @Transactional
        public ChatContactResponse acceptContactRequest(String userId, UUID contactRequestId) {
                User user = userRepository.findById(UUID.fromString(userId))
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                ChatContact contactRequest = contactRepository.findById(contactRequestId)
                                .orElseThrow(() -> new AppException(ErrorCode.CONTACT_REQUEST_NOT_FOUND));

                // Verify this request is for the current user
                if (!contactRequest.getContact().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                // Update the status
                contactRequest.setStatus(ContactStatus.ACCEPTED);
                contactRequest.setUpdatedAt(LocalDateTime.now());
                contactRequest = contactRepository.save(contactRequest);

                // Create a reciprocal contact entry
                ChatContact reciprocalContact = ChatContact.builder()
                                .user(contactRequest.getContact())
                                .contact(contactRequest.getUser())
                                .status(ContactStatus.ACCEPTED)
                                .displayName(contactRequest.getUser().getUsername())
                                .createdAt(LocalDateTime.now())
                                .build();

                reciprocalContact = contactRepository.save(reciprocalContact);

                log.info("Contact request accepted: {} accepted {}",
                                user.getUsername(), contactRequest.getUser().getUsername());

                // Notify the original requester
                ChatContactResponse response = contactMapper.toResponse(contactRequest);
                messagingTemplate.convertAndSendToUser(
                                contactRequest.getUser().getId().toString(),
                                "/queue/contact-updates",
                                response);

                return contactMapper.toResponse(reciprocalContact);
        }

        @Transactional
        public void rejectContactRequest(String userId, UUID contactRequestId) {
                User user = userRepository.findById(UUID.fromString(userId))
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                ChatContact contactRequest = contactRepository.findById(contactRequestId)
                                .orElseThrow(() -> new AppException(ErrorCode.CONTACT_REQUEST_NOT_FOUND));

                // Verify this request is for the current user
                if (!contactRequest.getContact().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                // Delete the contact request
                contactRepository.delete(contactRequest);

                log.info("Contact request rejected: {} rejected {}",
                                user.getUsername(), contactRequest.getUser().getUsername());

                // Notify the original requester
                messagingTemplate.convertAndSendToUser(
                                contactRequest.getUser().getId().toString(),
                                "/queue/contact-updates",
                                Map.of(
                                                "type", "REJECTED",
                                                "contactId", contactRequestId.toString()));
        }

        /**
         * Remove a contact by its ChatContact ID
         * 
         * @param userId    The ID of the user making the request
         * @param contactId The ID of the ChatContact entity to remove
         */
        @Transactional
        public void removeContact(String userId, UUID contactId) {
                log.info("ChatContactService.removeContact - Starting with userId: {}, contactId: {}", userId,
                                contactId);

                // Find the user
                User user;
                try {
                        user = userRepository.findById(UUID.fromString(userId))
                                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                        log.info("ChatContactService.removeContact - Found user: {}", user.getUsername());
                } catch (Exception e) {
                        log.error("ChatContactService.removeContact - Error finding user: {}", e.getMessage(), e);
                        throw e;
                }

                // Find the contact
                ChatContact contact;
                try {
                        contact = contactRepository.findById(contactId)
                                        .orElseThrow(() -> new AppException(ErrorCode.CONTACT_NOT_FOUND));
                        log.info("ChatContactService.removeContact - Found contact with ID: {}", contactId);
                } catch (Exception e) {
                        log.error("ChatContactService.removeContact - Error finding contact: {}", e.getMessage(), e);
                        throw e;
                }

                // Verify this contact belongs to the user
                if (!contact.getUser().getId().equals(user.getId())) {
                        log.error("ChatContactService.removeContact - Unauthorized: contact {} does not belong to user {}",
                                        contactId, userId);
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                log.info("ChatContactService.removeContact - Authorization check passed");

                // Find the reciprocal contact
                try {
                        log.info("ChatContactService.removeContact - Looking for reciprocal contact from {} to {}",
                                        contact.getContact().getUsername(), user.getUsername());

                        contactRepository.findByUserAndContact(contact.getContact(), user)
                                        .ifPresent(reciprocalContact -> {
                                                log.info("ChatContactService.removeContact - Found reciprocal contact with ID: {}",
                                                                reciprocalContact.getId());
                                                contactRepository.delete(reciprocalContact);
                                                log.info("ChatContactService.removeContact - Deleted reciprocal contact");
                                        });
                } catch (Exception e) {
                        log.error("ChatContactService.removeContact - Error handling reciprocal contact: {}",
                                        e.getMessage(), e);
                        throw e;
                }

                // Delete the contact
                try {
                        log.info("ChatContactService.removeContact - Deleting contact with ID: {}", contactId);
                        contactRepository.delete(contact);
                        contactRepository.flush(); // Force immediate flush to the database

                        // Double-check that the contact was deleted
                        boolean stillExists = contactRepository.existsById(contactId);
                        if (stillExists) {
                                log.error("ChatContactService.removeContact - Contact still exists after deletion attempt: {}",
                                                contactId);
                                // Try a direct delete by ID as a fallback
                                contactRepository.deleteById(contactId);
                                contactRepository.flush();
                                log.info("ChatContactService.removeContact - Attempted direct deleteById as fallback");
                        } else {
                                log.info("ChatContactService.removeContact - Successfully deleted contact and verified removal");
                        }
                } catch (Exception e) {
                        log.error("ChatContactService.removeContact - Error deleting contact: {}", e.getMessage(), e);
                        throw e;
                }

                log.info("ChatContactService.removeContact - Contact removed: {} removed {}",
                                user.getUsername(), contact.getContact().getUsername());
        }

        /**
         * Remove a contact by the ID of the contact user
         * 
         * @param userId        The ID of the user making the request
         * @param contactUserId The ID of the user who is the contact
         */
        @Transactional
        public void removeContactByContactUserId(String userId, UUID contactUserId) {
                log.info("ChatContactService.removeContactByContactUserId - Starting with userId: {}, contactUserId: {}",
                                userId, contactUserId);

                // Find the user
                User user;
                try {
                        user = userRepository.findById(UUID.fromString(userId))
                                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                        log.info("ChatContactService.removeContactByContactUserId - Found user: {}",
                                        user.getUsername());
                } catch (Exception e) {
                        log.error("ChatContactService.removeContactByContactUserId - Error finding user: {}",
                                        e.getMessage(), e);
                        throw e;
                }

                // Find the contact user
                User contactUser;
                try {
                        contactUser = userRepository.findById(contactUserId)
                                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                        log.info("ChatContactService.removeContactByContactUserId - Found contact user: {}",
                                        contactUser.getUsername());
                } catch (Exception e) {
                        log.error("ChatContactService.removeContactByContactUserId - Error finding contact user: {}",
                                        e.getMessage(), e);
                        throw e;
                }

                // Find the contact relationship
                ChatContact contact;
                try {
                        Optional<ChatContact> contactOpt = contactRepository.findByUserAndContact(user, contactUser);

                        if (contactOpt.isEmpty()) {
                                log.warn("ChatContactService.removeContactByContactUserId - Contact relationship not found between {} and {}",
                                                user.getUsername(), contactUser.getUsername());
                                // If the contact doesn't exist, we consider it already removed
                                log.info("ChatContactService.removeContactByContactUserId - Contact already removed or never existed");
                                return;
                        }

                        contact = contactOpt.get();
                        log.info("ChatContactService.removeContactByContactUserId - Found contact relationship with ID: {}",
                                        contact.getId());
                } catch (Exception e) {
                        log.error("ChatContactService.removeContactByContactUserId - Error finding contact relationship: {}",
                                        e.getMessage(), e);
                        throw e;
                }

                // Delete the contact directly instead of calling removeContact
                try {
                        log.info("ChatContactService.removeContactByContactUserId - Deleting contact with ID: {}",
                                        contact.getId());
                        contactRepository.delete(contact);
                        contactRepository.flush(); // Force immediate flush to the database

                        // Double-check that the contact was deleted
                        boolean stillExists = contactRepository.existsById(contact.getId());
                        if (stillExists) {
                                log.error("ChatContactService.removeContactByContactUserId - Contact still exists after deletion attempt: {}",
                                                contact.getId());
                                // Try a direct delete by ID as a fallback
                                contactRepository.deleteById(contact.getId());
                                contactRepository.flush();
                                log.info("ChatContactService.removeContactByContactUserId - Attempted direct deleteById as fallback");
                        } else {
                                log.info("ChatContactService.removeContactByContactUserId - Successfully deleted contact and verified removal");
                        }

                        // Also find and delete the reciprocal contact if it exists
                        contactRepository.findByUserAndContact(contactUser, user)
                                        .ifPresent(reciprocalContact -> {
                                                log.info("ChatContactService.removeContactByContactUserId - Found reciprocal contact with ID: {}",
                                                                reciprocalContact.getId());
                                                contactRepository.delete(reciprocalContact);
                                                contactRepository.flush();
                                                log.info("ChatContactService.removeContactByContactUserId - Deleted reciprocal contact");
                                        });
                } catch (Exception e) {
                        log.error("ChatContactService.removeContactByContactUserId - Error deleting contact: {}",
                                        e.getMessage(), e);
                        throw e;
                }
        }

        @Transactional
        public ChatContactResponse updateContact(String userId, UUID contactId, ChatContactRequest request) {
                User user = userRepository.findById(UUID.fromString(userId))
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                ChatContact contact = contactRepository.findById(contactId)
                                .orElseThrow(() -> new AppException(ErrorCode.CONTACT_NOT_FOUND));

                // Verify this contact belongs to the user
                if (!contact.getUser().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                // Update the display name
                contact.setDisplayName(request.getDisplayName());
                contact.setUpdatedAt(LocalDateTime.now());

                contact = contactRepository.save(contact);

                return contactMapper.toResponse(contact);
        }

        @Transactional(readOnly = true)
        public List<ChatContactResponse> getContacts(String userId) {
                User user = userRepository.findById(UUID.fromString(userId))
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                List<ChatContact> contacts = contactRepository.findByUserAndStatus(user, ContactStatus.ACCEPTED);

                // Enrich with unread message counts
                return contacts.stream()
                                .map(contact -> {
                                        int unreadCount = (int) messageRepository.countByReceiverAndReadFalse(user);
                                        return contactMapper.toResponseWithUnreadCount(contact, unreadCount);
                                })
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<ChatContactResponse> getPendingContactRequests(String userId) {
                User user = userRepository.findById(UUID.fromString(userId))
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                List<ChatContact> pendingRequests = contactRepository.findByContactAndStatus(user,
                                ContactStatus.PENDING);

                return contactMapper.toResponseList(pendingRequests);
        }

        @Transactional(readOnly = true)
        public List<ChatContactResponse> searchContacts(String userId, String searchTerm) {
                User user = userRepository.findById(UUID.fromString(userId))
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                List<ChatContact> contacts = contactRepository.searchContacts(user, searchTerm);

                return contactMapper.toResponseList(contacts);
        }

        /**
         * Get a specific contact by ID
         *
         * @param userId    The ID of the user making the request
         * @param contactId The ID of the contact to retrieve
         * @return The contact response
         */
        @Transactional(readOnly = true)
        public ChatContactResponse getContactById(String userId, UUID contactId) {
                User user = userRepository.findById(UUID.fromString(userId))
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                ChatContact contact = contactRepository.findById(contactId)
                                .orElseThrow(() -> new AppException(ErrorCode.CONTACT_NOT_FOUND));

                // Verify this contact belongs to the user
                if (!contact.getUser().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                // Get unread message count
                int unreadCount = (int) messageRepository.countByReceiverAndReadFalse(user);
                return contactMapper.toResponseWithUnreadCount(contact, unreadCount);
        }

        /**
         * Block a contact
         *
         * @param userId    The ID of the user making the request
         * @param contactId The ID of the contact to block
         * @return The updated contact response
         */
        @Transactional
        public ChatContactResponse blockContact(String userId, UUID contactId) {
                User user = userRepository.findById(UUID.fromString(userId))
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                ChatContact contact = contactRepository.findById(contactId)
                                .orElseThrow(() -> new AppException(ErrorCode.CONTACT_NOT_FOUND));

                // Verify this contact belongs to the user
                if (!contact.getUser().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                // Update the status
                contact.setStatus(ContactStatus.BLOCKED);
                contact.setUpdatedAt(LocalDateTime.now());
                contact = contactRepository.save(contact);

                log.info("Contact blocked: {} blocked {}",
                                user.getUsername(), contact.getContact().getUsername());

                return contactMapper.toResponse(contact);
        }

        /**
         * Unblock a contact
         *
         * @param userId    The ID of the user making the request
         * @param contactId The ID of the contact to unblock
         * @return The updated contact response
         */
        @Transactional
        public ChatContactResponse unblockContact(String userId, UUID contactId) {
                User user = userRepository.findById(UUID.fromString(userId))
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                ChatContact contact = contactRepository.findById(contactId)
                                .orElseThrow(() -> new AppException(ErrorCode.CONTACT_NOT_FOUND));

                // Verify this contact belongs to the user
                if (!contact.getUser().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                // Verify the contact is currently blocked
                if (contact.getStatus() != ContactStatus.BLOCKED) {
                        throw new AppException(ErrorCode.INVALID_REQUEST)
                                        .addMetadata("message", "Contact is not blocked");
                }

                // Update the status
                contact.setStatus(ContactStatus.ACCEPTED);
                contact.setUpdatedAt(LocalDateTime.now());
                contact = contactRepository.save(contact);

                log.info("Contact unblocked: {} unblocked {}",
                                user.getUsername(), contact.getContact().getUsername());

                return contactMapper.toResponse(contact);
        }

        /**
         * Update contact group
         *
         * @param userId    The ID of the user making the request
         * @param contactId The ID of the contact to update
         * @param group     The new group for the contact
         * @return The updated contact response
         */
        @Transactional
        public ChatContactResponse updateContactGroup(String userId, UUID contactId, String group) {
                User user = userRepository.findById(UUID.fromString(userId))
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                ChatContact contact = contactRepository.findById(contactId)
                                .orElseThrow(() -> new AppException(ErrorCode.CONTACT_NOT_FOUND));

                // Verify this contact belongs to the user
                if (!contact.getUser().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                // Update the group
                contact.setContactGroup(group);
                contact.setUpdatedAt(LocalDateTime.now());
                contact = contactRepository.save(contact);

                log.info("Contact group updated: {} updated {} to group {}",
                                user.getUsername(), contact.getContact().getUsername(), group);

                return contactMapper.toResponse(contact);
        }

        /**
         * Get all blocked contacts for a user
         *
         * @param userId The ID of the user
         * @return List of blocked contacts
         */
        @Transactional(readOnly = true)
        public List<ChatContactResponse> getBlockedContacts(String userId) {
                User user = userRepository.findById(UUID.fromString(userId))
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                List<ChatContact> blockedContacts = contactRepository.findByUserAndStatus(user, ContactStatus.BLOCKED);

                return contactMapper.toResponseList(blockedContacts);
        }
}
