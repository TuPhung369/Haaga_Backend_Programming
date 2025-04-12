package com.database.study.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.database.study.dto.request.ContactRequest;
import com.database.study.dto.response.ContactResponse;
import com.database.study.entity.Contact;
import com.database.study.entity.Contact.ContactStatus;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.mapper.ContactMapper;
import com.database.study.repository.ContactRepository;
import com.database.study.repository.MessageRepository;
import com.database.study.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ContactMapper contactMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ContactResponse addContact(String userId, ContactRequest request) {
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
        Contact contact = contactMapper.toEntity(user, contactUser, request.getDisplayName());
        contact = contactRepository.save(contact);

        log.info("Contact request sent from {} to {}", user.getUsername(), contactUser.getUsername());

        // Notify the contact user about the request
        ContactResponse response = contactMapper.toResponse(contact);
        messagingTemplate.convertAndSendToUser(
            contactUser.getId().toString(),
            "/queue/contact-requests",
            response
        );

        return response;
    }

    @Transactional
    public ContactResponse acceptContactRequest(String userId, UUID contactRequestId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Contact contactRequest = contactRepository.findById(contactRequestId)
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
        Contact reciprocalContact = Contact.builder()
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
        ContactResponse response = contactMapper.toResponse(contactRequest);
        messagingTemplate.convertAndSendToUser(
            contactRequest.getUser().getId().toString(),
            "/queue/contact-updates",
            response
        );

        return contactMapper.toResponse(reciprocalContact);
    }

    @Transactional
    public void rejectContactRequest(String userId, UUID contactRequestId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Contact contactRequest = contactRepository.findById(contactRequestId)
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
                "contactId", contactRequestId.toString()
            )
        );
    }

    @Transactional
    public void removeContact(String userId, UUID contactId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTACT_NOT_FOUND));

        // Verify this contact belongs to the user
        if (!contact.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Find the reciprocal contact
        contactRepository.findByUserAndContact(contact.getContact(), user)
                .ifPresent(contactRepository::delete);

        // Delete the contact
        contactRepository.delete(contact);

        log.info("Contact removed: {} removed {}",
                user.getUsername(), contact.getContact().getUsername());
    }

    @Transactional
    public ContactResponse updateContact(String userId, UUID contactId, ContactRequest request) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Contact contact = contactRepository.findById(contactId)
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
    public List<ContactResponse> getContacts(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<Contact> contacts = contactRepository.findByUserAndStatus(user, ContactStatus.ACCEPTED);

        // Enrich with unread message counts
        return contacts.stream()
                .map(contact -> {
                    int unreadCount = (int) messageRepository.countByReceiverAndReadFalse(user);
                    return contactMapper.toResponseWithUnreadCount(contact, unreadCount);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContactResponse> getPendingContactRequests(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<Contact> pendingRequests = contactRepository.findByContactAndStatus(user, ContactStatus.PENDING);

        return contactMapper.toResponseList(pendingRequests);
    }

    @Transactional(readOnly = true)
    public List<ContactResponse> searchContacts(String userId, String searchTerm) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<Contact> contacts = contactRepository.searchContacts(user, searchTerm);

        return contactMapper.toResponseList(contacts);
    }
}
