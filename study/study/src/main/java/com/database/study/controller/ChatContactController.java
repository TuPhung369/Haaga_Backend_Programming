package com.database.study.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

import com.database.study.dto.response.ChatContactResponse;
import com.database.study.dto.response.ChatMessageResponse;
import com.database.study.dto.response.ChatMessageResponse.UserInfo;
import com.database.study.entity.ChatContact;
import com.database.study.entity.User;
import com.database.study.repository.ChatContactRepository;
import com.database.study.repository.UserRepository;
import com.database.study.service.ChatContactService;

@RestController
@RequestMapping("/chat")
@Slf4j
public class ChatContactController {

    @Autowired
    private ChatContactRepository contactRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WebSocketMessageController webSocketMessageController;

    @Autowired
    private ChatContactService chatContactService;

    // In-memory storage for messages - we'll keep these in memory for now
    private final Map<String, List<ChatMessageResponse>> messages = new HashMap<>();
    private final Map<String, Integer> unreadCounts = new HashMap<>();

    public ChatContactController() {
        // Initialize demo data for messages only
        initializeDemoData();
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<ChatContactResponse>> getContacts() {
        // Log the authentication context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("Authentication in getContacts: " + (auth != null ? auth.getName() : "null"));

        // Get current user
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            System.out.println("Current user is null in getContacts");
            return ResponseEntity.badRequest().build();
        }

        System.out.println("Current user found: " + currentUser.getEmail() + ", ID: " + currentUser.getId());

        // Get contacts from database
        List<ChatContact> userContacts = contactRepository.findByUser(currentUser);

        // Convert to response objects
        List<ChatContactResponse> contactResponses = userContacts.stream()
                .map(contact -> {
                    User contactUser = contact.getContact();
                    ChatContactResponse response = new ChatContactResponse();
                    response.setId(contactUser.getId().toString());
                    response.setName(contact.getDisplayName() != null ? contact.getDisplayName()
                            : getUserDisplayName(contactUser));
                    response.setEmail(contactUser.getEmail());

                    // Set status from user's actual status
                    response.setStatus(contactUser.getUserStatus() != null ? contactUser.getUserStatus() : "online");

                    response.setGroup(contact.getContactGroup()); // Set the contact group
                    response.setContactStatus(contact.getStatus().toString()); // Add contact status

                    // Set unread count and last message if available
                    String contactId = contactUser.getId().toString();
                    response.setUnreadCount(unreadCounts.getOrDefault(contactId, 0));
                    List<ChatMessageResponse> contactMessages = messages.getOrDefault(contactId, new ArrayList<>());
                    if (!contactMessages.isEmpty()) {
                        response.setLastMessage(contactMessages.get(contactMessages.size() - 1).getContent());
                    }

                    return response;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(contactResponses);
    }

    // This endpoint is now handled by ChatMessageController
    // @GetMapping("/messages/{contactId}")
    // public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable
    // String contactId) {
    // // Implementation moved to ChatMessageController
    // }

    // This endpoint is now handled by ChatMessageController
    // @PostMapping("/messages")
    // public ResponseEntity<ChatMessageResponse> sendMessage(@RequestBody
    // ChatMessageRequest request) {
    // // Implementation moved to ChatMessageController
    // }

    // This endpoint is now handled by ChatMessageController
    // @PostMapping("/messages/read/{contactId}")
    // public ResponseEntity<Void> markMessagesAsRead(@PathVariable String
    // contactId) {
    // // Implementation moved to ChatMessageController
    // }

    @PostMapping("/contacts")
    public ResponseEntity<ChatContactResponse> addContact(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");

        if (email == null) {
            return ResponseEntity.badRequest().build();
        }

        // Get current user
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.badRequest().build();
        }

        // Find user to add as contact
        Optional<User> contactUserOpt = userRepository.findByEmail(email);
        if (contactUserOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User contactUser = contactUserOpt.get();

        // Check if contact already exists
        Optional<ChatContact> existingContact = contactRepository.findByUserAndContact(currentUser, contactUser);
        if (existingContact.isPresent()) {
            // Return existing contact
            ChatContact contact = existingContact.get();

            ChatContactResponse response = new ChatContactResponse();
            response.setId(contactUser.getId().toString());
            response.setName(
                    contact.getDisplayName() != null ? contact.getDisplayName() : getUserDisplayName(contactUser));
            response.setEmail(contactUser.getEmail());
            response.setStatus(contactUser.getUserStatus() != null ? contactUser.getUserStatus() : "offline");
            response.setUnreadCount(0);

            return ResponseEntity.ok(response);
        }

        // Create new contact
        ChatContact newContact = ChatContact.builder()
                .user(currentUser)
                .contact(contactUser)
                .status(ChatContact.ContactStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        // Save to database
        contactRepository.save(newContact);

        // Send WebSocket notification to the contact user
        log.info("Sending contact request notification to user: {}", contactUser.getId());
        webSocketMessageController.sendContactRequestNotification(
                currentUser.getId().toString(),
                contactUser.getId().toString(),
                getUserDisplayName(currentUser));

        // Create response DTO
        ChatContactResponse response = new ChatContactResponse();
        response.setId(contactUser.getId().toString());
        response.setName("New Contact (" + email + ")");
        response.setEmail(contactUser.getEmail());
        response.setStatus("pending");
        response.setUnreadCount(0);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/contacts/{contactId}/displayname")
    public ResponseEntity<ChatContactResponse> updateContactDisplayName(
            @PathVariable String contactId,
            @RequestBody Map<String, String> payload) {

        String displayName = payload.get("displayName");
        if (displayName == null) {
            return ResponseEntity.badRequest().build();
        }

        // Get current user
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.badRequest().build();
        }

        // Find contact by ID
        try {
            UUID contactUserId = UUID.fromString(contactId);
            Optional<User> contactUserOpt = userRepository.findById(contactUserId);

            if (contactUserOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            User contactUser = contactUserOpt.get();

            // Find the contact relationship
            Optional<ChatContact> contactOpt = contactRepository.findByUserAndContact(currentUser, contactUser);

            if (contactOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Update display name
            ChatContact contact = contactOpt.get();
            contact.setDisplayName(displayName);
            contact.setUpdatedAt(LocalDateTime.now());
            contactRepository.save(contact);

            // Create response
            ChatContactResponse response = new ChatContactResponse();
            response.setId(contactUser.getId().toString());
            response.setName(displayName);
            response.setEmail(contactUser.getEmail());
            response.setStatus(contactUser.getUserStatus() != null ? contactUser.getUserStatus() : "online");
            response.setGroup(contact.getContactGroup());
            response.setContactStatus(contact.getStatus().toString());

            // Set unread count and last message if available
            String cId = contactUser.getId().toString();
            response.setUnreadCount(unreadCounts.getOrDefault(cId, 0));
            List<ChatMessageResponse> contactMessages = messages.getOrDefault(cId, new ArrayList<>());
            if (!contactMessages.isEmpty()) {
                response.setLastMessage(contactMessages.get(contactMessages.size() - 1).getContent());
            }

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/contacts/{contactId}/group")
    public ResponseEntity<ChatContactResponse> updateContactGroup(
            @PathVariable String contactId,
            @RequestBody Map<String, String> payload) {

        String group = payload.get("group");
        if (group == null) {
            return ResponseEntity.badRequest().build();
        }

        // Get current user
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.badRequest().build();
        }

        // Find contact by ID
        try {
            UUID contactUserId = UUID.fromString(contactId);
            Optional<User> contactUserOpt = userRepository.findById(contactUserId);

            if (contactUserOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            User contactUser = contactUserOpt.get();

            // Find the contact relationship
            Optional<ChatContact> contactOpt = contactRepository.findByUserAndContact(currentUser, contactUser);

            if (contactOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Update group
            ChatContact contact = contactOpt.get();
            contact.setContactGroup(group);
            contact.setUpdatedAt(LocalDateTime.now());
            contactRepository.save(contact);

            // Create response
            ChatContactResponse response = new ChatContactResponse();
            response.setId(contactUser.getId().toString());
            response.setName(
                    contact.getDisplayName() != null ? contact.getDisplayName() : getUserDisplayName(contactUser));
            response.setEmail(contactUser.getEmail());
            response.setStatus(contactUser.getUserStatus() != null ? contactUser.getUserStatus() : "online");
            response.setGroup(contact.getContactGroup());

            // Set unread count and last message if available
            String cId = contactUser.getId().toString();
            response.setUnreadCount(unreadCounts.getOrDefault(cId, 0));
            List<ChatMessageResponse> contactMessages = messages.getOrDefault(cId, new ArrayList<>());
            if (!contactMessages.isEmpty()) {
                response.setLastMessage(contactMessages.get(contactMessages.size() - 1).getContent());
            }

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // This endpoint is now handled by ChatMessageController
    // @GetMapping("/messages/unread/count")
    // public ResponseEntity<Map<String, Integer>> getUnreadMessageCount() {
    // // Implementation moved to ChatMessageController
    // }

    /**
     * Get pending contact requests for the current user
     * 
     * @return List of pending contact requests
     */
    @GetMapping("/contacts/pending")
    public ResponseEntity<List<ChatContactResponse>> getPendingContactRequests() {
        // Get current user
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.badRequest().build();
        }

        // Find contacts where current user is the contact and status is PENDING
        List<ChatContact> pendingRequests = contactRepository.findByContactAndStatus(
                currentUser, ChatContact.ContactStatus.PENDING);

        // Convert to response objects
        List<ChatContactResponse> responseList = pendingRequests.stream()
                .map(contact -> {
                    User requestUser = contact.getUser(); // The user who sent the request
                    ChatContactResponse response = new ChatContactResponse();
                    response.setId(requestUser.getId().toString());
                    response.setName(getUserDisplayName(requestUser));
                    response.setEmail(requestUser.getEmail());
                    response.setStatus(requestUser.getUserStatus() != null ? requestUser.getUserStatus() : "online");
                    response.setContactStatus(contact.getStatus().toString());
                    response.setUnreadCount(0);
                    return response;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    /**
     * Accept or reject a contact request
     * 
     * @param contactId ID of the user who sent the request
     * @param payload   Contains action ("accept" or "reject")
     * @return Updated contact information
     */
    @PostMapping("/contacts/{contactId}/respond")
    public ResponseEntity<ChatContactResponse> respondToContactRequest(
            @PathVariable String contactId,
            @RequestBody Map<String, String> payload) {

        String action = payload.get("action");
        if (action == null || (!action.equals("accept") && !action.equals("reject"))) {
            return ResponseEntity.badRequest().build();
        }

        // Get current user
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.badRequest().build();
        }

        // Find the user who sent the request
        try {
            UUID requestUserId = UUID.fromString(contactId);
            Optional<User> requestUserOpt = userRepository.findById(requestUserId);

            if (requestUserOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            User requestUser = requestUserOpt.get();

            // Find the pending contact request
            Optional<ChatContact> pendingRequestOpt = contactRepository.findByUserAndContact(requestUser, currentUser);

            if (pendingRequestOpt.isEmpty() ||
                    pendingRequestOpt.get().getStatus() != ChatContact.ContactStatus.PENDING) {
                return ResponseEntity.notFound().build();
            }

            ChatContact pendingRequest = pendingRequestOpt.get();

            if (action.equals("accept")) {
                // Accept the request
                pendingRequest.setStatus(ChatContact.ContactStatus.ACCEPTED);
                pendingRequest.setUpdatedAt(LocalDateTime.now());
                contactRepository.save(pendingRequest);

                // Create a reciprocal contact relationship
                if (!contactRepository.existsByUserAndContact(currentUser, requestUser)) {
                    ChatContact reciprocalContact = ChatContact.builder()
                            .user(currentUser)
                            .contact(requestUser)
                            .status(ChatContact.ContactStatus.ACCEPTED)
                            .createdAt(LocalDateTime.now())
                            .build();
                    contactRepository.save(reciprocalContact);
                }

                // Send WebSocket notification to the requester that their request was accepted
                log.info("Sending contact response notification to user: {}", requestUser.getId());
                webSocketMessageController.sendContactResponseNotification(
                        requestUser.getId().toString(),
                        currentUser.getId().toString(),
                        getUserDisplayName(currentUser),
                        true);
            } else {
                // Reject the request - delete it
                contactRepository.delete(pendingRequest);

                // Send WebSocket notification to the requester that their request was rejected
                log.info("Sending contact rejection notification to user: {}", requestUser.getId());
                webSocketMessageController.sendContactResponseNotification(
                        requestUser.getId().toString(),
                        currentUser.getId().toString(),
                        getUserDisplayName(currentUser),
                        false);
            }

            // Create response
            ChatContactResponse response = new ChatContactResponse();
            response.setId(requestUser.getId().toString());
            response.setName(getUserDisplayName(requestUser));
            response.setEmail(requestUser.getEmail());
            response.setStatus("online"); // Set status to online for the accepted contact
            response.setContactStatus(
                    action.equals("accept") ? ChatContact.ContactStatus.ACCEPTED.toString() : "REJECTED");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get the authenticated user from the security context
     * 
     * @return The current user or null if not authenticated
     */
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        // Try to find user by email first
        Optional<User> userByEmail = userRepository.findByEmail(auth.getName());
        if (userByEmail.isPresent()) {
            return userByEmail.get();
        }

        // If not found by email, try by username
        Optional<User> userByUsername = userRepository.findByUsername(auth.getName());
        if (userByUsername.isPresent()) {
            return userByUsername.get();
        }

        // Log the authentication details for debugging
        System.out.println("Authentication name: " + auth.getName());
        System.out.println("Authentication principal: " + auth.getPrincipal());
        System.out.println("Authentication authorities: " + auth.getAuthorities());

        return null;
    }

    /**
     * Generate a display name from a user entity
     * 
     * @param user The user entity
     * @return A display name based on firstname + lastname, or username if those
     *         are not available
     */
    private String getUserDisplayName(User user) {
        if (user.getFirstname() != null && user.getLastname() != null) {
            return user.getFirstname() + " " + user.getLastname();
        } else if (user.getUsername() != null) {
            return user.getUsername();
        } else {
            return user.getEmail();
        }
    }

    /**
     * Permanently remove a contact
     * 
     * @param contactId ID of the contact to remove
     * @return Success response
     */
    @DeleteMapping("/contacts/{contactId}")
    public ResponseEntity<Map<String, Object>> removeContact(@PathVariable String contactId) {
        log.info("DELETE /chat/contacts/{} - Request received to remove contact", contactId);
        try {
            // Get current user
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                log.error("DELETE /chat/contacts/{} - User not authenticated", contactId);
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "User not authenticated"));
            }

            // Convert contactId to UUID
            UUID contactUUID;
            try {
                contactUUID = UUID.fromString(contactId);
                log.info("DELETE /chat/contacts/{} - Valid UUID format", contactId);
            } catch (IllegalArgumentException e) {
                log.error("DELETE /chat/contacts/{} - Invalid UUID format", contactId);
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Invalid contact ID format"));
            }

            // Find contact by ID
            Optional<User> contactUserOpt = userRepository.findById(contactUUID);
            if (contactUserOpt.isEmpty()) {
                log.error("DELETE /chat/contacts/{} - Contact user not found", contactId);
                return ResponseEntity.notFound().build();
            }

            User contactUser = contactUserOpt.get();
            log.info("DELETE /chat/contacts/{} - Found contact user: {}", contactId, contactUser.getUsername());

            // Check if the contact relationship exists
            boolean contactExists = contactRepository.existsByUserAndContact(currentUser, contactUser);
            
            // Use the service to permanently remove the contact
            try {
                log.info("DELETE /chat/contacts/{} - Contact relationship exists: {}", contactId, contactExists);
                
                if (contactExists) {
                    log.info("DELETE /chat/contacts/{} - Calling service to remove contact with user ID: {}", 
                        contactId, contactUser.getUsername());
                    
                    // The contactId in the URL is the ID of the contact user
                    // We use the method that takes a contact user ID
                    chatContactService.removeContactByContactUserId(currentUser.getId().toString(), contactUUID);
                    
                    log.info("DELETE /chat/contacts/{} - Contact successfully removed from database", contactId);
                } else {
                    log.info("DELETE /chat/contacts/{} - Contact relationship does not exist, nothing to remove", contactId);
                }
            } catch (Exception e) {
                log.error("DELETE /chat/contacts/{} - Error in service layer: {}", contactId, e.getMessage(), e);
                throw e; // Re-throw to be caught by outer try-catch
            }

            // Send WebSocket notification if needed
            log.info("Contact permanently removed: {} removed {}",
                    currentUser.getUsername(), contactUser.getUsername());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Contact permanently removed",
                    "contactId", contactId));
        } catch (Exception e) {
            log.error("Error removing contact", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "An error occurred while removing the contact: " + e.getMessage()));
        }
    }

    private void initializeDemoData() {
        // Create some messages (Keep only the messages part for demo)
        List<ChatMessageResponse> messages1 = new ArrayList<>();

        ChatMessageResponse message1 = new ChatMessageResponse();
        message1.setId("message-1");
        message1.setContent("Hi there!");
        message1.setSender(new UserInfo("contact-1", "John Doe"));
        message1.setReceiver(new UserInfo("user-1", "Current User"));
        message1.setTimestamp(LocalDateTime.now().minusHours(2).toString());
        message1.setRead(true);
        messages1.add(message1);

        ChatMessageResponse message2 = new ChatMessageResponse();
        message2.setId("message-2");
        message2.setContent("Hello, how are you?");
        message2.setSender(new UserInfo("user-1", "Current User"));
        message2.setReceiver(new UserInfo("contact-1", "John Doe"));
        message2.setTimestamp(LocalDateTime.now().minusHours(1).toString());
        message2.setRead(true);
        messages1.add(message2);

        ChatMessageResponse message3 = new ChatMessageResponse();
        message3.setId("message-3");
        message3.setContent("I'm good, thanks for asking!");
        message3.setSender(new UserInfo("contact-1", "John Doe"));
        message3.setReceiver(new UserInfo("user-1", "Current User"));
        message3.setTimestamp(LocalDateTime.now().minusMinutes(30).toString());
        message3.setRead(false);
        messages1.add(message3);

        this.messages.put("contact-1", messages1);

        List<ChatMessageResponse> messages2 = new ArrayList<>();

        ChatMessageResponse message4 = new ChatMessageResponse();
        message4.setId("message-4");
        message4.setContent("Are we still meeting tomorrow?");
        message4.setSender(new UserInfo("user-1", "Current User"));
        message4.setReceiver(new UserInfo("contact-2", "Jane Smith"));
        message4.setTimestamp(LocalDateTime.now().minusDays(1).toString());
        message4.setRead(true);
        messages2.add(message4);

        ChatMessageResponse message5 = new ChatMessageResponse();
        message5.setId("message-5");
        message5.setContent("Yes, at 2 PM.");
        message5.setSender(new UserInfo("contact-2", "Jane Smith"));
        message5.setReceiver(new UserInfo("user-1", "Current User"));
        message5.setTimestamp(LocalDateTime.now().minusHours(23).toString());
        message5.setRead(true);
        messages2.add(message5);

        ChatMessageResponse message6 = new ChatMessageResponse();
        message6.setId("message-6");
        message6.setContent("Great, see you tomorrow!");
        message6.setSender(new UserInfo("user-1", "Current User"));
        message6.setReceiver(new UserInfo("contact-2", "Jane Smith"));
        message6.setTimestamp(LocalDateTime.now().minusHours(22).toString());
        message6.setRead(true);
        messages2.add(message6);

        this.messages.put("contact-2", messages2);

        // Set unread counts
        unreadCounts.put("contact-1", 2);
        unreadCounts.put("contact-2", 0);
    }
}
