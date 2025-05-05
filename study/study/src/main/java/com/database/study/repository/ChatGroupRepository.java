package com.database.study.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.database.study.entity.ChatGroup;
import com.database.study.entity.User;

@Repository
public interface ChatGroupRepository extends JpaRepository<ChatGroup, UUID> {

    // Replaced with a more explicit query
    @Query("SELECT DISTINCT g FROM ChatGroup g JOIN g.members m WHERE m = :user")
    List<ChatGroup> findByMembersContaining(@Param("user") User user);

    @Query("SELECT g FROM ChatGroup g JOIN g.members m WHERE m.id = :userId")
    List<ChatGroup> findGroupsByUserId(@Param("userId") UUID userId);

    @Query("SELECT CASE WHEN COUNT(g) > 0 THEN true ELSE false END FROM ChatGroup g JOIN g.members m WHERE g.id = :groupId AND m.id = :userId")
    boolean isUserMemberOfGroup(@Param("groupId") UUID groupId, @Param("userId") UUID userId);

    @Query("SELECT CASE WHEN g.createdBy.id = :userId THEN true ELSE false END FROM ChatGroup g WHERE g.id = :groupId")
    boolean isUserCreatorOfGroup(@Param("groupId") UUID groupId, @Param("userId") UUID userId);

    /**
     * Find all groups where a user is a member
     * 
     * @param userId The ID of the user
     * @return List of groups where the user is a member
     */
    @Query("SELECT g FROM ChatGroup g JOIN g.members m WHERE m.id = :userId")
    List<ChatGroup> findGroupsWhereUserIsMember(@Param("userId") UUID userId);

    /**
     * Find all groups created by a user
     * 
     * @param userId The ID of the user who created the groups
     * @return List of groups created by the user
     */
    @Query("SELECT g FROM ChatGroup g WHERE g.createdBy.id = :userId")
    List<ChatGroup> findGroupsCreatedByUser(@Param("userId") UUID userId);
}