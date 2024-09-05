package com.model.bookstore.model;

public class Book {
  private String title;
  private String author;
  private int year;
  private String isbn;
  private double price;

  // Constructors
  public Book() {
  }

  public Book(String title, String author, int year, String isbn, double price) {
    this.title = title;
    this.author = author;
    this.year = year;
    this.isbn = isbn;
    this.price = price;
  }

  // Getters and Setters
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

  public int getYear() {
    return year;
  }

  public void setYear(int year) {
    this.year = year;
  }

  public String getIsbn() {
    return isbn;
  }

  public void setIsbn(String isbn) {
    this.isbn = isbn;
  }

  public double getPrice() {
    return price;
  }

  public void setPrice(double price) {
    this.price = price;
  }
}
