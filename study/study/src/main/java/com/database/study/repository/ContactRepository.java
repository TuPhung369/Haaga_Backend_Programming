package com.database.study.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.database.study.entity.Contact;
import com.database.study.entity.Contact.ContactStatus;
import com.database.study.entity.User;

@Repository
public interface ContactRepository extends JpaRepository<Contact, UUID> {
    
    // Find all contacts for a user with a specific status
    List<Contact> findByUserAndStatus(User user, ContactStatus status);
    
    // Find all contacts for a user (regardless of status)
    List<Contact> findByUser(User user);
    
    // Find pending contact requests for a user
    List<Contact> findByContactAndStatus(User contact, ContactStatus status);
    
    // Find a specific contact relationship
    Optional<Contact> findByUserAndContact(User user, User contact);
    
    // Check if a contact relationship exists
    boolean existsByUserAndContact(User user, User contact);
    
    // Search contacts by username or email
    @Query("SELECT c FROM Contact c WHERE c.user = :user AND " +
           "(c.contact.username LIKE %:searchTerm% OR c.contact.email LIKE %:searchTerm%)")
    List<Contact> searchContacts(@Param("user") User user, @Param("searchTerm") String searchTerm);
    
    // Find users who are not contacts of the given user
    @Query("SELECT u FROM User u WHERE u.id != :userId AND " +
           "u.id NOT IN (SELECT c.contact.id FROM Contact c WHERE c.user.id = :userId)")
    List<User> findNonContacts(@Param("userId") UUID userId);
}
