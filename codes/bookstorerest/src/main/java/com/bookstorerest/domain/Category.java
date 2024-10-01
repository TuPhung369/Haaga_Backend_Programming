package com.bookstorerest.domain;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Category {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY) // Consider using IDENTITY for clarity
  private Long categoryId; // Changed to camelCase
  private String name;

  @JsonIgnore
  @OneToMany(cascade = CascadeType.ALL, mappedBy = "category")
  private List<Book> books;

  public Category() {
  }

  public Category(String name) {
    this.name = name;
  }

  // Getters and setters
  public Long getCategoryId() {
    return categoryId; // Updated getter to match camelCase
  }

  public void setCategoryId(Long categoryId) { // Updated setter to match camelCase
    this.categoryId = categoryId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public List<Book> getBooks() {
    return books;
  }

  public void setBooks(List<Book> books) {
    this.books = books;
  }

  @Override
  public String toString() {
    return "Category [categoryId=" + categoryId + ", name=" + name + "]"; // Updated toString
  }
}
