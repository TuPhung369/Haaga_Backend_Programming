package com.database.parttwo.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Book {

  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long id;
  private String author;
  private String title;
  private String isbn;
  private String year;

  @ManyToOne
  @JoinColumn(name = "category_id")
  private Category category;

  // Default constructor
  public Book() {
  }

  // Parameterized constructor
  public Book(String author, String title, String isbn, String year, Category category) {
    this.author = author;
    this.title = title;
    this.isbn = isbn;
    this.year = year;
    this.category = category;
  }

  // Getters and setters
  public Category getCategory() {
    return category;
  }

  public void setCategory(Category category) {
    this.category = category;
  }

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
    return year;
  }

  public void setYear(String year) {
    this.year = year;
  }

  @Override
  public String toString() {
    return String.format("Book[id=%d, author='%s', title='%s', isbn='%s', year='%s', category='%s']",
        id, author, title, isbn, year, category != null ? category.getName() : "None");
  }
}
