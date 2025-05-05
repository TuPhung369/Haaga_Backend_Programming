package com.database.study.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.database.study.entity.ChatContact;
import com.database.study.entity.ChatContact.ContactStatus;
import com.database.study.entity.User;

@Repository
public interface ChatContactRepository extends JpaRepository<ChatContact, UUID> {

    /**
     * Find all contacts for a specific user
     *
     * @param user The user whose contacts to find
     * @return List of contacts
     */
    List<ChatContact> findByUser(User user);

    /**
     * Find a specific contact relationship between two users
     *
     * @param user The user who owns the contact
     * @param contact The user who is the contact
     * @return Optional containing the contact if found
     */
    Optional<ChatContact> findByUserAndContact(User user, User contact);

    /**
     * Find contacts with a specific status for a user
     *
     * @param user The user whose contacts to find
     * @param status The contact status to filter by
     * @return List of contacts with the specified status
     */
    List<ChatContact> findByUserAndStatus(User user, ChatContact.ContactStatus status);

    // Find pending contact requests for a user
    List<ChatContact> findByContactAndStatus(User contact, ContactStatus status);

    // Check if a contact relationship exists
    boolean existsByUserAndContact(User user, User contact);

    // Search contacts by username or email
    @Query("SELECT c FROM ChatContact c WHERE c.user = :user AND " +
           "(c.contact.username LIKE %:searchTerm% OR c.contact.email LIKE %:searchTerm%)")
    List<ChatContact> searchContacts(@Param("user") User user, @Param("searchTerm") String searchTerm);

    // Find users who are not contacts of the given user
    @Query("SELECT u FROM User u WHERE u.id != :userId AND " +
           "u.id NOT IN (SELECT c.contact.id FROM ChatContact c WHERE c.user.id = :userId)")
    List<User> findNonContacts(@Param("userId") UUID userId);
    
    /**
     * Delete all chat contacts where the user is either the owner or the contact
     * 
     * @param userId The ID of the user whose contacts to delete
     */
    @Modifying
    @Query("DELETE FROM ChatContact c WHERE c.user.id = :userId OR c.contact.id = :userId")
    void deleteByUserIdOrContactId(@Param("userId") UUID userId);
}
