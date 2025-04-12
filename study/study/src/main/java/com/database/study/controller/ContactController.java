package com.database.study.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.database.study.dto.request.ContactRequest;
import com.database.study.dto.response.ContactResponse;
import com.database.study.service.ContactService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
@Slf4j
public class ContactController {
    
    private final ContactService contactService;
    
    @PostMapping
    public ResponseEntity<ContactResponse> addContact(@Valid @RequestBody ContactRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Adding contact for user {}: {}", userId, request.getUsernameOrEmail());
        ContactResponse response = contactService.addContact(userId, request);
        
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/accept/{contactRequestId}")
    public ResponseEntity<ContactResponse> acceptContactRequest(@PathVariable UUID contactRequestId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Accepting contact request {} for user {}", contactRequestId, userId);
        ContactResponse response = contactService.acceptContactRequest(userId, contactRequestId);
        
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/reject/{contactRequestId}")
    public ResponseEntity<Void> rejectContactRequest(@PathVariable UUID contactRequestId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Rejecting contact request {} for user {}", contactRequestId, userId);
        contactService.rejectContactRequest(userId, contactRequestId);
        
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/{contactId}")
    public ResponseEntity<Void> removeContact(@PathVariable UUID contactId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Removing contact {} for user {}", contactId, userId);
        contactService.removeContact(userId, contactId);
        
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{contactId}")
    public ResponseEntity<ContactResponse> updateContact(
            @PathVariable UUID contactId,
            @Valid @RequestBody ContactRequest request) {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Updating contact {} for user {}", contactId, userId);
        ContactResponse response = contactService.updateContact(userId, contactId, request);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<List<ContactResponse>> getContacts() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Getting contacts for user {}", userId);
        List<ContactResponse> contacts = contactService.getContacts(userId);
        
        return ResponseEntity.ok(contacts);
    }
    
    @GetMapping("/pending")
    public ResponseEntity<List<ContactResponse>> getPendingContactRequests() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Getting pending contact requests for user {}", userId);
        List<ContactResponse> pendingRequests = contactService.getPendingContactRequests(userId);
        
        return ResponseEntity.ok(pendingRequests);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<ContactResponse>> searchContacts(@RequestParam String searchTerm) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Searching contacts for user {} with term: {}", userId, searchTerm);
        List<ContactResponse> searchResults = contactService.searchContacts(userId, searchTerm);
        
        return ResponseEntity.ok(searchResults);
    }
}
