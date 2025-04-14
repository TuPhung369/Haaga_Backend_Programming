package com.database.study.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import com.database.study.mapper.EventMapper;
import com.database.study.mapper.KanbanBoardMapper;
import com.database.study.mapper.KanbanColumnMapper;
import com.database.study.mapper.KanbanTaskMapper;
import com.database.study.mapper.PermissionMapper;
import com.database.study.mapper.RoleMapper;
import com.database.study.mapper.UserMapper;

/**
 * Configuration class to ensure MapStruct mappers are properly registered as Spring beans.
 */
@Configuration
public class MapperRegistrationConfig {
    
    @Bean
    @Primary
    public UserMapper userMapper(UserMapper userMapper) {
        return userMapper;
    }
    
    @Bean
    @Primary
    public RoleMapper roleMapper(RoleMapper roleMapper) {
        return roleMapper;
    }
    
    @Bean
    @Primary
    public PermissionMapper permissionMapper(PermissionMapper permissionMapper) {
        return permissionMapper;
    }
    
    @Bean
    @Primary
    public EventMapper eventMapper(EventMapper eventMapper) {
        return eventMapper;
    }
    
    @Bean
    @Primary
    public KanbanBoardMapper kanbanBoardMapper(KanbanBoardMapper kanbanBoardMapper) {
        return kanbanBoardMapper;
    }
    
    @Bean
    @Primary
    public KanbanColumnMapper kanbanColumnMapper(KanbanColumnMapper kanbanColumnMapper) {
        return kanbanColumnMapper;
    }
    
    @Bean
    @Primary
    public KanbanTaskMapper kanbanTaskMapper(KanbanTaskMapper kanbanTaskMapper) {
        return kanbanTaskMapper;
    }
}