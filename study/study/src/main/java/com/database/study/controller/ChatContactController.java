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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.database.study.dto.request.ChatMessageRequest;
import com.database.study.dto.response.ChatContactResponse;
import com.database.study.dto.response.ChatMessageResponse;
import com.database.study.dto.response.ChatMessageResponse.UserInfo;
import com.database.study.entity.ChatContact;
import com.database.study.entity.User;
import com.database.study.repository.ChatContactRepository;
import com.database.study.repository.UserRepository;

@RestController
@RequestMapping("/chat")
public class ChatContactController {

    @Autowired
    private ChatContactRepository contactRepository;

    @Autowired
    private UserRepository userRepository;

    // In-memory storage for messages - we'll keep these in memory for now
    private final Map<String, List<ChatMessageResponse>> messages = new HashMap<>();
    private final Map<String, Integer> unreadCounts = new HashMap<>();

    public ChatContactController() {
        // Initialize demo data for messages only
        initializeDemoData();
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<ChatContactResponse>> getContacts() {
        // Get current user
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.badRequest().build();
        }

        // Get contacts from database
        List<ChatContact> userContacts = contactRepository.findByUser(currentUser);

        // Convert to response objects
        List<ChatContactResponse> contactResponses = userContacts.stream()
            .map(contact -> {
                User contactUser = contact.getContact();
                ChatContactResponse response = new ChatContactResponse();
                response.setId(contactUser.getId().toString());
                response.setName(contact.getDisplayName() != null ?
                    contact.getDisplayName() : getUserDisplayName(contactUser));
                response.setEmail(contactUser.getEmail());
                response.setStatus("online"); // Could be determined by user's last activity
                response.setGroup(contact.getContactGroup()); // Set the contact group

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

    @GetMapping("/messages/{contactId}")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable String contactId) {
        List<ChatMessageResponse> contactMessages = messages.getOrDefault(contactId, new ArrayList<>());
        return ResponseEntity.ok(contactMessages);
    }

    @PostMapping("/messages")
    public ResponseEntity<ChatMessageResponse> sendMessage(@RequestBody ChatMessageRequest request) {
        String content = request.getContent();
        String receiverId = request.getReceiverId();

        if (content == null || receiverId == null) {
            return ResponseEntity.badRequest().build();
        }

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.badRequest().build();
        }

        // Get the receiver user
        Optional<User> receiverUserOpt = userRepository.findById(UUID.fromString(receiverId));
        if (receiverUserOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        User receiverUser = receiverUserOpt.get();

        // Create a new message
        ChatMessageResponse message = new ChatMessageResponse();
        message.setId(UUID.randomUUID().toString());
        message.setContent(content);
        message.setSender(new UserInfo(currentUser.getId().toString(), getUserDisplayName(currentUser)));
        message.setReceiver(new UserInfo(receiverId, getUserDisplayName(receiverUser)));
        message.setTimestamp(LocalDateTime.now().toString());
        message.setRead(false);

        // Add to messages list
        List<ChatMessageResponse> contactMessages = messages.computeIfAbsent(receiverId, k -> new ArrayList<>());
        contactMessages.add(message);

        // Increment unread count for receiver
        unreadCounts.put(receiverId, unreadCounts.getOrDefault(receiverId, 0) + 1);

        return ResponseEntity.ok(message);
    }

    @PostMapping("/messages/read/{contactId}")
    public ResponseEntity<Void> markMessagesAsRead(@PathVariable String contactId) {
        // Mark all messages as read
        List<ChatMessageResponse> contactMessages = messages.getOrDefault(contactId, new ArrayList<>());
        for (ChatMessageResponse message : contactMessages) {
            message.setRead(true);
        }

        // Reset unread count
        unreadCounts.put(contactId, 0);

        return ResponseEntity.ok().build();
    }

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
            response.setName(contact.getDisplayName() != null ?
                contact.getDisplayName() : getUserDisplayName(contactUser));
            response.setEmail(contactUser.getEmail());
            response.setStatus("offline");
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

        // Create response DTO
        ChatContactResponse response = new ChatContactResponse();
        response.setId(contactUser.getId().toString());
        response.setName("New Contact (" + email + ")");
        response.setEmail(contactUser.getEmail());
        response.setStatus("offline");
        response.setUnreadCount(0);

        return ResponseEntity.ok(response);
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
            response.setName(contact.getDisplayName() != null ?
                contact.getDisplayName() : getUserDisplayName(contactUser));
            response.setEmail(contactUser.getEmail());
            response.setStatus("online");  // Could be determined by activity
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

    @GetMapping("/messages/unread/count")
    public ResponseEntity<Map<String, Integer>> getUnreadMessageCount() {
        int totalCount = unreadCounts.values().stream().mapToInt(Integer::intValue).sum();
        Map<String, Integer> response = new HashMap<>();
        response.put("count", totalCount);
        return ResponseEntity.ok(response);
    }

    /**
     * Get the authenticated user from the security context
     * @return The current user or null if not authenticated
     */
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    /**
     * Generate a display name from a user entity
     * @param user The user entity
     * @return A display name based on firstname + lastname, or username if those are not available
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
