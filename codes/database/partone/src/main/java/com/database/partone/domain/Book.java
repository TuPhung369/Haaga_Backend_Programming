package com.database.partone.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Book {

  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long id;
  private String author;
  private String title;
  private String isbn;
  private String publicationYear;

  public Book() {
  }

  // Parameterized constructor
  public Book(String author, String title, String isbn, String publicationYear) {
    this.author = author;
    this.title = title;
    this.isbn = isbn;
    this.publicationYear = publicationYear;
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

  public String getIsbn() {
    return isbn;
  }

  public void setIsbn(String isbn) {
    this.isbn = isbn;
  }

  public String getYear() {
    return publicationYear;
  }

  public void setYear(String publicationYear) {
    this.publicationYear = publicationYear;
  }

  @Override
  public String toString() {
    return String.format("Book[id=%d, author='%s', title='%s', isbn='%s', year='%s']", id, author, title,
        isbn,
        publicationYear);
  }
}
