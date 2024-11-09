package com.database.study.repository;

import com.database.study.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {
  Optional<Role> findByName(String name);

  List<Role> findByNameIn(List<String> names);

  @Query("SELECT r FROM Role r LEFT JOIN FETCH r.permissions WHERE r.name = :name")
  Optional<Role> findByNameWithPermissions(@Param("name") String name);
}