package com.bookstorerest.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

@Entity
public class Book {

  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long id;

  @NotNull(message = "Title is required")
  @NotEmpty(message = "Title cannot be empty")
  private String title;

  @NotNull(message = "Author is required")
  @NotEmpty(message = "Author cannot be empty")
  private String author;

  @NotNull(message = "Category must be selected")
  @ManyToOne
  @JoinColumn(name = "categoryId")
  private Category category;

  public Book() {
  }

  public Book(String title, String author, Category category) {
    this.title = title;
    this.author = author;
    this.category = category;
  }

  // Getters and setters
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getAuthor() {
    return author;
  }

  public void setAuthor(String author) {
    this.author = author;
  }

  public Category getCategory() {
    return category;
  }

  public void setCategory(Category category) {
    this.category = category;
  }

  @Override
  public String toString() {
    return "Book [id=" + id + ", title=" + title + ", author=" + author + ", category="
        + (category != null ? category.getName() : "N/A") + "]";
  }
}
