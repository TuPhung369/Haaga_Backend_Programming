package com.bookstorerest.bookstorerest.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.OneToMany;

@Entity
public class BookStore {

  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long id;

  private String title;
  private String author;

  // Ignore one-to-many relationship in the JSON output
  @JsonIgnore
  @OneToMany(mappedBy = "book")
  private List<SomeOtherEntity> entities;

  // Getters and setters
}