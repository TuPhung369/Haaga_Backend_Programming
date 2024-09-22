package com.bookstorerest.bookstorerest.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import javax.validation.constraints.NotEmpty;

@Entity
public class Book {

  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long id;
  @NotEmpty(message = "Title cannot be empty")
  private String title;

  @NotEmpty(message = "Author cannot be empty")
  private String author;

  // Ignore one-to-many relationship in the JSON output
  @ManyToOne
  @JoinColumn(name = "categoryid")
  private Category category;

  public Book() {
  }

  public Book(String title, String author, Category category) {
    super();
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
    if (category != null)
      return "Book [id=" + id + ", title=" + title + ", author=" + author + ", category=" + this.getCategory() + "]";
    else
      return "Book [id=" + id + ", title=" + title + ", author=" + author + "]";
  }
}