package com.database.study.controller;

import com.database.study.dto.ChatContactDTO;
import com.database.study.dto.ChatMessageDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ChatController {

    // In-memory storage for demo purposes
    private final Map<String, ChatContactDTO> contacts = new HashMap<>();
    private final Map<String, List<ChatMessageDTO>> messages = new HashMap<>();
    private final Map<String, Integer> unreadCounts = new HashMap<>();

    public ChatController() {
        // Initialize with some demo data
        initializeDemoData();
    }

    @GetMapping("/chat/contacts")
    public ResponseEntity<List<ChatContactDTO>> getContacts() {
        return ResponseEntity.ok(new ArrayList<>(contacts.values()));
    }

    @GetMapping("/chat/messages/{contactId}")
    public ResponseEntity<List<ChatMessageDTO>> getMessages(@PathVariable String contactId) {
        List<ChatMessageDTO> contactMessages = messages.getOrDefault(contactId, new ArrayList<>());
        return ResponseEntity.ok(contactMessages);
    }

    @PostMapping("/chat/messages")
    public ResponseEntity<ChatMessageDTO> sendMessage(@RequestBody Map<String, String> payload) {
        String content = payload.get("content");
        String receiverId = payload.get("receiverId");

        if (content == null || receiverId == null) {
            return ResponseEntity.badRequest().build();
        }

        // Create a new message
        ChatMessageDTO message = new ChatMessageDTO();
        message.setId(UUID.randomUUID().toString());
        message.setContent(content);
        message.setSender(new ChatMessageDTO.User("user-1", "Current User"));
        message.setReceiver(new ChatMessageDTO.User(receiverId, contacts.get(receiverId).getName()));
        message.setTimestamp(LocalDateTime.now().toString());
        message.setRead(false);

        // Add to messages list
        List<ChatMessageDTO> contactMessages = messages.computeIfAbsent(receiverId, k -> new ArrayList<>());
        contactMessages.add(message);

        // Increment unread count for receiver
        unreadCounts.put(receiverId, unreadCounts.getOrDefault(receiverId, 0) + 1);

        // Update last message in contact
        ChatContactDTO contact = contacts.get(receiverId);
        contact.setLastMessage(content);
        contact.setUnreadCount(unreadCounts.get(receiverId));

        return ResponseEntity.ok(message);
    }

    @PostMapping("/chat/messages/read/{contactId}")
    public ResponseEntity<Void> markMessagesAsRead(@PathVariable String contactId) {
        // Mark all messages as read
        List<ChatMessageDTO> contactMessages = messages.getOrDefault(contactId, new ArrayList<>());
        for (ChatMessageDTO message : contactMessages) {
            message.setRead(true);
        }

        // Reset unread count
        unreadCounts.put(contactId, 0);

        // Update contact
        ChatContactDTO contact = contacts.get(contactId);
        if (contact != null) {
            contact.setUnreadCount(0);
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping("/chat/contacts")
    public ResponseEntity<ChatContactDTO> addContact(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");

        if (email == null) {
            return ResponseEntity.badRequest().build();
        }

        // Check if contact already exists
        for (ChatContactDTO contact : contacts.values()) {
            if (contact.getEmail().equals(email)) {
                return ResponseEntity.ok(contact);
            }
        }

        // Create a new contact
        ChatContactDTO contact = new ChatContactDTO();
        contact.setId(UUID.randomUUID().toString());
        contact.setName("New Contact (" + email + ")");
        contact.setEmail(email);
        contact.setStatus("offline");
        contact.setUnreadCount(0);

        // Add to contacts
        contacts.put(contact.getId(), contact);

        return ResponseEntity.ok(contact);
    }

    @GetMapping("/chat/messages/unread/count")
    public ResponseEntity<Map<String, Integer>> getUnreadMessageCount() {
        int totalCount = unreadCounts.values().stream().mapToInt(Integer::intValue).sum();
        Map<String, Integer> response = new HashMap<>();
        response.put("count", totalCount);
        return ResponseEntity.ok(response);
    }

    private void initializeDemoData() {
        // Create some contacts
        ChatContactDTO contact1 = new ChatContactDTO();
        contact1.setId("contact-1");
        contact1.setName("John Doe");
        contact1.setEmail("john.doe@example.com");
        contact1.setStatus("online");
        contact1.setUnreadCount(2);
        contact1.setLastMessage("Hello, how are you?");
        contacts.put(contact1.getId(), contact1);

        ChatContactDTO contact2 = new ChatContactDTO();
        contact2.setId("contact-2");
        contact2.setName("Jane Smith");
        contact2.setEmail("jane.smith@example.com");
        contact2.setStatus("offline");
        contact2.setUnreadCount(0);
        contact2.setLastMessage("See you tomorrow!");
        contacts.put(contact2.getId(), contact2);

        // Create some messages
        List<ChatMessageDTO> messages1 = new ArrayList<>();

        ChatMessageDTO message1 = new ChatMessageDTO();
        message1.setId("message-1");
        message1.setContent("Hi there!");
        message1.setSender(new ChatMessageDTO.User("contact-1", "John Doe"));
        message1.setReceiver(new ChatMessageDTO.User("user-1", "Current User"));
        message1.setTimestamp(LocalDateTime.now().minusHours(2).toString());
        message1.setRead(true);
        messages1.add(message1);

        ChatMessageDTO message2 = new ChatMessageDTO();
        message2.setId("message-2");
        message2.setContent("Hello, how are you?");
        message2.setSender(new ChatMessageDTO.User("user-1", "Current User"));
        message2.setReceiver(new ChatMessageDTO.User("contact-1", "John Doe"));
        message2.setTimestamp(LocalDateTime.now().minusHours(1).toString());
        message2.setRead(true);
        messages1.add(message2);

        ChatMessageDTO message3 = new ChatMessageDTO();
        message3.setId("message-3");
        message3.setContent("I'm good, thanks for asking!");
        message3.setSender(new ChatMessageDTO.User("contact-1", "John Doe"));
        message3.setReceiver(new ChatMessageDTO.User("user-1", "Current User"));
        message3.setTimestamp(LocalDateTime.now().minusMinutes(30).toString());
        message3.setRead(false);
        messages1.add(message3);

        this.messages.put("contact-1", messages1);

        List<ChatMessageDTO> messages2 = new ArrayList<>();

        ChatMessageDTO message4 = new ChatMessageDTO();
        message4.setId("message-4");
        message4.setContent("Are we still meeting tomorrow?");
        message4.setSender(new ChatMessageDTO.User("user-1", "Current User"));
        message4.setReceiver(new ChatMessageDTO.User("contact-2", "Jane Smith"));
        message4.setTimestamp(LocalDateTime.now().minusDays(1).toString());
        message4.setRead(true);
        messages2.add(message4);

        ChatMessageDTO message5 = new ChatMessageDTO();
        message5.setId("message-5");
        message5.setContent("Yes, at 2 PM.");
        message5.setSender(new ChatMessageDTO.User("contact-2", "Jane Smith"));
        message5.setReceiver(new ChatMessageDTO.User("user-1", "Current User"));
        message5.setTimestamp(LocalDateTime.now().minusHours(23).toString());
        message5.setRead(true);
        messages2.add(message5);

        ChatMessageDTO message6 = new ChatMessageDTO();
        message6.setId("message-6");
        message6.setContent("Great, see you tomorrow!");
        message6.setSender(new ChatMessageDTO.User("user-1", "Current User"));
        message6.setReceiver(new ChatMessageDTO.User("contact-2", "Jane Smith"));
        message6.setTimestamp(LocalDateTime.now().minusHours(22).toString());
        message6.setRead(true);
        messages2.add(message6);

        this.messages.put("contact-2", messages2);

        // Set unread counts
        unreadCounts.put("contact-1", 2);
        unreadCounts.put("contact-2", 0);
    }
}
