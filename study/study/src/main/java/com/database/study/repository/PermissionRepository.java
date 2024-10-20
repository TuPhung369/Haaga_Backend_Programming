package com.database.study.repository;

import com.database.study.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Set;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {
  Permission findByName(String name); // Find one permission by name

  Set<Permission> findByNameIn(Set<String> names); // Batch lookup for multiple names
}
