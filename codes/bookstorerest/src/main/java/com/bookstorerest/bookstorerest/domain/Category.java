package com.bookstorerest.bookstorerest.domain;

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
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long categoryid;
  private String name;

  @JsonIgnore
  @OneToMany(cascade = { CascadeType.PERSIST, CascadeType.REMOVE }, mappedBy = "category")
  private List<Book> books;

  public Category() {
  }

  public Category(String name) {
    super();
    this.name = name;
  }

  // Getters and setters
  public Long getCategoryId() {
    return categoryid;
  }

  public void setCategoryId(Long categoryid) {
    this.categoryid = categoryid;
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
    return "Category [categoryid=" + categoryid + ", name=" + name + "]";
  }
}